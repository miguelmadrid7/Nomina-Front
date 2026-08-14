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
        duration: number): void {
            const key = `${type}|${title}|${message}`;
            if(this.activeToast.has(key)) {
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