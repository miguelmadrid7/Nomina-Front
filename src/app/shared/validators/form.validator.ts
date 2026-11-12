import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

/** 
 * El valor debe ser un código de quincena yyyyQQ (año de 4 dígitos + quincena del 01 al 24). 
*/
export function qnaFormatValidator(): ValidatorFn {
  const formato = /^\d{4}(0[1-9]|1\d|2[0-4])$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    return formato.test(value) ? null : { qnaFormat: { value } };
  };
}