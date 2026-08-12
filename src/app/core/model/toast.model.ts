export interface Toast {
    id: number;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message: string;
    duration?: number;
    closing?: boolean;
}