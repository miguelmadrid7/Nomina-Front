import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appUppercase]'
})
export class UppercaseDirective {

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;

    const upper = (input.value ?? '').toUpperCase();

    input.value = upper;

    // fuerza sincronización con ngModel
    input.dispatchEvent(new Event('input'));
  }
}