import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Toast } from "../model/toast.model";

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private readonly _toasts = new BehaviorSubject<Toast[]>([]);
    readonly toasts = this._toasts.asObservable();

    success(title: string, message: string,  duration = 4000) {
        this.add('success', title, message, duration);
    }

    error(title: string, message: string, duration = 6000) {
        this.add('error', title, message, duration);
    }

    warning(title: string, message: string, duration = 6000) {
        this.add('warning', title, message, duration);
    }

    info(title: string, message: string, duration = 6000) {
        this.add('info', title, message, duration);
    }

    remove(id: number) {
        this._toasts.next(
            this._toasts.value.filter(t => t.id !== id)
        );
    }

    private add(
        type: Toast['type'],
        title: string,
        message: string,
        duration: number) {
            const toast: Toast = {
                id: Date.now(),
                type,
                title,
                message, 
                duration
            };
            this._toasts.next([
                ...this._toasts.value, toast
            ]);

            setTimeout(() => {
                this.remove(toast.id);
            }, duration);
    }
}