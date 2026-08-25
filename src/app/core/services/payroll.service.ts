import { Injectable, NgZone, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { environment } from '../../../environments/environment';
import { NominaService } from './nomina-ordinaria.service';
import { ToastService } from './toast.service';
import { ProgressMessage } from '../model/progress-message.model';
import { StepExecution } from '../model/step-execution.model';
import { PayRollJobState, INITIAL_PAYROLL_JOB_STATE } from '../model/payrolljobstate.model';
import { isPlatformBrowser } from '@angular/common';

const MAX_POLL_ATTEMPTS = 240;
const POLL_INTERVAL_MS = 500;
const PROGRESS_TOAST_ID = -1;
const JOB_ID_STORAGE_KEY = 'payroll-job-id';

@Injectable({ providedIn: 'root' })
export class PayrollJobService implements OnDestroy {

    private readonly nominaService = inject(NominaService);
    private readonly toastService = inject(ToastService);
    private readonly zone = inject(NgZone);
    private readonly platformId = inject(PLATFORM_ID); // ⬅️ nuevo
    private readonly isBrowser = isPlatformBrowser(this.platformId); 

    private readonly state$$ = new BehaviorSubject<PayRollJobState>(INITIAL_PAYROLL_JOB_STATE);
    readonly state: Observable<PayRollJobState> = this.state$$.asObservable();
    private stompClient: Stomp.Client | null = null;
    private pollingHandle: ReturnType<typeof setInterval> | null = null;

     /**
     * Al crear la instancia (una vez por sesión de navegador, ya que es singleton root),
     * intenta reconectar a un proceso que haya quedado corriendo antes de un refresh.
     */
    constructor() {
        this.tryReconnect();
    }

     /**
     * Revisa si hay un jobId guardado en sessionStorage (proceso interrumpido por un
     * F5/reload). Si el proceso ya terminó en el backend, solo limpia el storage.
     * Si sigue corriendo, reconstruye el estado local y reconecta el WebSocket.
     */
    private tryReconnect(): void {
        if (!this.isBrowser) {
            return; // ⬅️ en SSR no hay nada que reconectar
        }
        const savedJobId = this.getSavedJobId();
        if (!savedJobId) {
            return;
        }
        this.nominaService.getJobStatus(savedJobId).subscribe({
            next: (resp: any) => {
                const serverProgress = resp?.data?.progress ?? 0;
                const serverStatus = resp?.data?.status ?? '';
                if (serverStatus === 'COMPLETED' || serverStatus === 'ERROR') {
                    // Ya terminó mientras no estábamos: no reconectamos WS, solo limpiamos.
                    this.clearSavedJobId();
                    return;
                }
                // Sigue corriendo: reconstruimos el estado y reconectamos.
                this.patchState({
                    jobId: savedJobId,
                    processing: true,
                    progress: serverProgress,
                });
                this.toastService.upsertPersistent(PROGRESS_TOAST_ID, 'info', 'Cálculo en progreso', `Reconectando... Avance: ${serverProgress}%`);
                this.reconnectSocket(savedJobId);
            },
            error: () => {
                // El jobId guardado ya no es válido (ej. muy viejo); limpiamos por seguridad.
                this.clearSavedJobId();
            }
        });
    }

    /** Abre una nueva conexión STOMP y se suscribe al job indicado (usado por tryReconnect). */
    private reconnectSocket(jobId: number): void {
        const ws = new SockJS(`${environment.apiUrl}/ws`);
        this.stompClient = Stomp.over(ws);
        this.stompClient.connect(
            {},
            () => this.subscribeToJob(jobId),
            () => this.onSocketError()
        );
    }

    /** Snapshot síncrono del estado actual (útil fuera de un subscribe). */
    get snapshot(): PayRollJobState {
        return this.state$$.value;
    }

     /** Indica si hay un cálculo en curso en este momento. */
    get isRunning(): boolean {
        return this.snapshot.processing;
    }

     /**
     * Punto de entrada público para iniciar el cálculo de nómina. Si ya hay uno
     * corriendo, avisa y no hace nada más. Si no, resetea el estado, muestra el
     * toast persistente de progreso y arranca la conexión con el backend.
     */
    start(qnaProceso: number): void {
        if (this.isRunning) {
            this.toastService.warning('Proceso', 'Ya hay un cálculo en ejecución.', 4000);
            return;
        }
        this.patchState({
            ...INITIAL_PAYROLL_JOB_STATE,
            processing: true,
        });
        this.toastService.upsertPersistent(PROGRESS_TOAST_ID, 'info', 'Cálculo en progreso', 'Iniciando proceso...');
        this.connectAndExecute(qnaProceso);
    }

    /** Guarda el jobId activo en sessionStorage, para poder reconectar tras un refresh. */
    private saveJobId(jobId: number): void {
        if (!this.isBrowser) return;
        sessionStorage.setItem(JOB_ID_STORAGE_KEY, String(jobId));
    }


    /** Elimina el jobId guardado (se llama al completar, fallar, o si ya no es válido). */
    private clearSavedJobId(): void {
        if (!this.isBrowser) return;
        sessionStorage.removeItem(JOB_ID_STORAGE_KEY);
    }

    /** Lee el jobId guardado en sessionStorage, si existe. */
    private getSavedJobId(): number | null {
        if (!this.isBrowser) return null;
        const raw = sessionStorage.getItem(JOB_ID_STORAGE_KEY);
        return raw ? Number(raw) : null;
    }

    /** Abre la conexión STOMP inicial y, una vez conectada, dispara la ejecución del proceso. */
    private connectAndExecute(qnaProceso: number): void {
        const ws = new SockJS(`${environment.apiUrl}/ws`);
        this.stompClient = Stomp.over(ws);
        this.stompClient.connect(
            {},
            () => this.onSocketConnected(qnaProceso),
            () => this.onSocketError()
        );
    }

    /**
     * Callback cuando el WebSocket ya está conectado: llama al backend para iniciar
     * el proceso, guarda el jobId recibido y se suscribe a las actualizaciones de ese job.
     */
    private onSocketConnected(qnaProceso: number): void {
        this.nominaService.executePayrollProcess(qnaProceso).subscribe({
            next: (resp: any) => {
                const jobId = resp?.data;
                if (!jobId) {
                    this.patchState({ processing: false });
                    this.toastService.warning('Proceso', 'No se recibió el identificador del proceso.', 6000);
                    this.disconnect();
                    return;
                }
                this.patchState({ jobId });
                this.saveJobId(jobId);
                this.subscribeToJob(jobId);
            },
            error: () => {
                this.patchState({ processing: false });
                this.toastService.error('Proceso', 'No se pudo iniciar el proceso. Verifica que el servidor esté disponible.', 6000);
                this.disconnect();
            }
        });
    }

    /** Callback cuando falla la conexión WebSocket (backend caído, red, etc.). */
    private onSocketError(): void {
        this.zone.run(() => {
            this.patchState({ processing: false });
            this.toastService.warning('WebSocket', 'No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.', 6000);
        });
    }

    /**
     * Se suscribe al topic STOMP del job (actualizaciones en tiempo real) y además
     * arranca el polling de respaldo, por si algún mensaje del WS se pierde.
     */
    private subscribeToJob(jobId: number): void {
        this.stompClient?.subscribe(`/topic/payroll/${jobId}`, (message: any) => {
            const data: ProgressMessage = JSON.parse(message.body);
            this.zone.run(() => this.handleProgressUpdate(data));
        });
        this.startPolling(jobId);
    }

     /**
     * Polling de respaldo: consulta el estado del job cada POLL_INTERVAL_MS,
     * hasta MAX_POLL_ATTEMPTS veces o hasta que el job termine/falle.
     */
    private startPolling(jobId: number): void {
        let intentos = 0;
        this.pollingHandle = setInterval(() => {
            intentos++;
            this.nominaService.getJobStatus(jobId).subscribe({
                next: (resp: any) => {
                    const serverProgress = resp?.data?.progress ?? 0;
                    const serverStatus = resp?.data?.status ?? '';
                    this.zone.run(() => {
                        if (serverProgress > this.snapshot.progress) {
                            this.patchState({ progress: serverProgress });
                        }
                        if (intentos >= MAX_POLL_ATTEMPTS || serverStatus === 'COMPLETED' || serverStatus === 'ERROR') {
                            this.stopPolling();
                        }
                    });
                },
                error: () => this.zone.run(() => this.stopPolling())
            });
        }, POLL_INTERVAL_MS);
    }

    /** Detiene el polling de respaldo, si estaba activo. */
    private stopPolling(): void {
        if (this.pollingHandle) {
            clearInterval(this.pollingHandle);
            this.pollingHandle = null;
        }
    }

    /**
     * Procesa cada mensaje de progreso recibido por WebSocket: actualiza el estado,
     * refresca el toast persistente con el % actual, y delega a error/completado
     * según corresponda.
     */
    private handleProgressUpdate(data: ProgressMessage): void {
        const progress = Math.max(this.snapshot.progress, data.progress);
        const executionHistory = this.mergeExecutionHistory(data);
        this.patchState({
            progress,
            executionHistory,
            totalDurationMs: data.totalDurationMs ?? this.snapshot.totalDurationMs,
        });
        this.toastService.upsertPersistent(PROGRESS_TOAST_ID, 'info', 'Cálculo en progreso', `Avance: ${progress}%`);
        if (data.status === 'ERROR') {
            this.handleJobError(data);
            return;
        }
        if (!this.snapshot.deliverableReady && (data.progress === 100 || data.status === 'COMPLETED')) {
            this.handleJobCompleted();
        }
    }

    /**
     * Agrega (de forma inmutable) el detalle de ejecución de un paso al historial,
     * si el mensaje trae la información completa de ese paso.
     */
    private mergeExecutionHistory(data: ProgressMessage): ReadonlyMap<number, StepExecution> {
        if (data.stepIndex == null || data.stepName == null || data.durationMs == null) {
            return this.snapshot.executionHistory;
        }
        const updated = new Map(this.snapshot.executionHistory);
        updated.set(data.stepIndex, {
            stepName: data.stepName,
            endTime: data.endTime ?? '',
            durationMs: data.durationMs
        });
        return updated;
    }

     /**
     * Maneja el caso de error del proceso: guarda el detalle del error en el estado,
     * resuelve el toast persistente como error, limpia el jobId guardado y desconecta.
     */
    private handleJobError(data: ProgressMessage): void {
        const userMessage = data.userMessage ?? 'Ocurrió un error durante el cálculo de nómina.';
        this.patchState({
            failedStepIndex: data.failedStepIndex ?? null,
            failedStepName: data.failedStepName ?? null,
            errorMessage: data.errorMsg ?? null,
            errorType: data.errorType ?? null,
            userMessage,
            processing: false,
        });
        this.toastService.resolvePersistent(PROGRESS_TOAST_ID, 'error', 'Proceso detenido', userMessage, 6000);
        this.clearSavedJobId(); 
        this.disconnect();
    }

     /**
     * Maneja el caso de éxito: marca el resultado como listo, resuelve el toast
     * persistente como éxito, limpia el jobId guardado y desconecta.
     */
    private handleJobCompleted(): void {
        this.patchState({
            deliverableReady: true,
            processing: false,
        });
        this.toastService.resolvePersistent(PROGRESS_TOAST_ID, 'success', 'Proceso finalizado', 'El cálculo de nómina terminó correctamente.', 6000);
        this.clearSavedJobId();
        this.disconnect();
    }

    /** Detiene el polling y cierra la conexión STOMP, si estaba activa. */
    private disconnect(): void {
        this.stopPolling();
        if (this.stompClient?.connected) {
            this.stompClient.disconnect(() => {});
        }
        this.stompClient = null;
    }

    /** Único punto de mutación del estado: combina el estado actual con los cambios parciales. */
    private patchState(partial: Partial<PayRollJobState>): void {
        this.state$$.next({ ...this.snapshot, ...partial });
    }

    /** Limpieza al destruirse el servicio (caso raro en un singleton root, pero por seguridad). */
    ngOnDestroy(): void {
        this.disconnect();
    }
}