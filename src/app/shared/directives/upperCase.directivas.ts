import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]',
  standalone: true,
})
export class UppercaseDirective {

  constructor(private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const upper = (input.value ?? '').toUpperCase();
    if (input.value === upper) return;
    input.value = upper;
    this.ngControl.control?.setValue(upper, { emitEvent: false });
    input.setSelectionRange(start, end);
  }
}