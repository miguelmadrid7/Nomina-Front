import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { ToastService } from "../services/toast.service";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";


export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    
    const toastService = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.error('Http error: ', error);
            switch(error.status) {
                case 0:
                    toastService.error(
                        'Sin conexión', 
                        'No fue posible conectar con el servidor. Inténtalo nuevamente.', 
                        6000
                    );
                break;

                case 400:
                    toastService.warning(
                        'Solicitud inválida', 
                         'La información enviada no es válida.',
                        6000
                    );
                break;

                case 401:
                    toastService.warning(
                        'Sesión expirada', 
                        'Tu sesión ha expirado. Inicia sesión nuevamente',
                        6000
                    );
                break;

                case 403:
                    toastService.error(
                        'Acceso denegado', 
                        'No tienes permisos para realizar esta operación',
                        6000
                    );
                break;

                case 404:
                    toastService.error(
                        'Recurso no encontrado', 
                        'El recurso solicitado no está disponible',
                        6000
                    );
                break;

                case 500:
                    toastService.error(
                        'Error del servidor', 
                        'Ocurrió un problema en el servidor. Inténtalo nuevamente.',
                        6000
                    );
                break;

                case 502:
                case 503:
                case 504:
                    toastService.error(
                        'Servicio no disponible', 
                        'El servidor no está disponible actualmente. Inténtalo nuevamente.',
                        6000
                    );
                break;

                default:
                    toastService.error(
                        'Error',
                        'Ocurrió un error inesperado. Inténtalo nuevamente.',
                        5000
                    );
                    break;
            }
            return throwError (() => error);
        })
    );
}