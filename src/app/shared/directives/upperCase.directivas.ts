import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]'
})
export class UppercaseDirective {

  constructor(private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = (input.value ?? '').toUpperCase();
    if (input.value !== upper) {
       this.control.control?.setValue(upper, { emitEvent: false });
    }
  }
}