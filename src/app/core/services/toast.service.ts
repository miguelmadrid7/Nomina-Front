import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Toast } from "../model/toast.model";

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    private readonly _toasts = new BehaviorSubject<Toast[]>([]);
    readonly toasts = this._toasts.asObservable();

    success(title: string, message: string) {
        this.add('success', title, message);
    }

    error(title: string, message: string) {
        this.add('error', title, message);
    }

    warning(title: string, message: string) {
        this.add('warning', title, message);
    }

    infoo(title: string, message: string) {
        this.add('info', title, message);
    }

    remove(id: number) {
        this._toasts.next(
            this._toasts.value.filter(t => t.id !== id)
        );
    }

    add(
        type: Toast['type'],
        title: string,
        message: string) {
            const toast: Toast = {
                id: Date.now(),
                type,
                title,
                message
            };
            this._toasts.next([
                ...this._toasts.value, toast
            ]);
    }
}