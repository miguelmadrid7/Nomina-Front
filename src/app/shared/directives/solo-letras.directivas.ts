import { Directive, HostListener } from "@angular/core";

@Directive({
    selector: '[appSoloLetras]'
})
export class SoloLetrasDirectiva {
    @HostListener('keydown', ['$event'])

    onKeyDown(event: KeyboardEvent){
        const teclasPermitidas = [
            'Backspace',
            'ArrowLeft',
            'ArrowRight',
            'Tab',
            'Delete',
            ' '
        ];
        if (teclasPermitidas.includes(event.key)) {
            return;
        }
        const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]$/;
        if (!regex.test(event.key)) {
            event.preventDefault();
        }
    }
}