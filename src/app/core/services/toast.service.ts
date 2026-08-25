import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Toast } from "../model/toast.model";

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private readonly _toasts = new BehaviorSubject<Toast[]>([]);
    private readonly activeToast = new Set<string>;
    readonly toasts = this._toasts.asObservable();

    /* Muestra el toast de exito */
    success(title: string, message: string, duration = 4000) {
        this.add('success', title, message, duration);
    }

    /* Muestra el toast de error */
    error(title: string, message: string, duration = 6000) {
        this.add('error', title, message, duration);
    }

    /* Muestra el toast de warning */
    warning(title: string, message: string, duration = 6000) {
        this.add('warning', title, message, duration);
    }

    /* Muestra el toast de informacion */
    info(title: string, message: string, duration = 6000) {
        this.add('info', title, message, duration);
    }

    /* Elimina un toast del listado por su id, sin animación de salida. */
    remove(id: number) {
        this._toasts.next(
            this._toasts.value.filter(t => t.id !== id)
        );
    }

    /**
     * Crea o actualiza un toast persistente (sin auto-cierre) identificado por `id` fijo.
     * Si ya existe uno con ese id, actualiza su contenido en el mismo lugar en vez de
     * crear uno nuevo (útil para reflejar progreso en tiempo real, ej. "Avance: 45%").
     */
    upsertPersistent(id: number, type: Toast['type'], title: string, message: string): number {
        const existing = this._toasts.value.find(t => t.id === id);
        if (existing) {
            const updated = this._toasts.value.map(t =>
                t.id === id ? { ...t, type, title, message } : t
            );
            this._toasts.next(updated);
            return id;
        }
        const toast: Toast = {
            id,
            type,
            title,
            message,
            duration: 0,
            closing: false,
            persistent: true
        };
        this._toasts.next([...this._toasts.value, toast]);
        return id;
    }

    /**
     * Convierte un toast persistente (creado con `upsertPersistent`) en uno normal:
     * actualiza su contenido/tipo final (ej. éxito o error) y programa su auto-cierre.
     * Reutiliza el mismo `id`, así no aparece un toast duplicado.
     */
    resolvePersistent(id: number, type: Toast['type'], title: string, message: string, duration = 6000): void {
        const updated = this._toasts.value.map(t =>
            t.id === id ? { ...t, type, title, message, duration, persistent: false } : t
        );
        this._toasts.next(updated);

        setTimeout(() => {
            this.startClosing(id, `${type}|${title}|${message}`);
        }, duration);
    }

    /* Cierra manualmente un toast persistente sin pasar por la animación/timeout de resolvePersistent. */
    dismissPersistent(id: number): void {
        this.remove(id);
    }

    /**
     * Lógica interna compartida por success/error/warning/info: evita duplicados
     * (mismo type+title+message activo al mismo tiempo), agrega el toast al listado
     * y programa su cierre automático tras `duration` ms.
     */
    private add(
        type: Toast['type'],
        title: string,
        message: string,
        duration: number): void {
            const key = `${type}|${title}|${message}`;
            if (this.activeToast.has(key)) {
                return;
            }
            this.activeToast.add(key);
            const toast: Toast = {
                id: Date.now(),
                type,
                title,
                message,
                duration,
                closing: false
            };
            this._toasts.next([
                ...this._toasts.value, toast
            ]);

            setTimeout(() => {
                this.startClosing(toast.id, key);
            }, duration);
    }

    /**
     * Marca un toast como "cerrando" (dispara la animación de salida en el template)
     * y, tras 300ms, lo remueve definitivamente y libera su key de `activeToast`.
     */
    private startClosing(id: number, key: string): void {
        const updated = this._toasts.value.map(toast =>
            toast.id === id
            ? { ...toast, closing: true }
            : toast
        );

        this._toasts.next(updated);
        setTimeout(() => {
            this.remove(id);
            this.activeToast.delete(key);
        }, 300);
    }
}