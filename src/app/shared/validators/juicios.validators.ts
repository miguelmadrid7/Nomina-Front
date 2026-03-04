import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

// No-op RFC validator: keeps API surface but enforces nothing
export function rfcValidator(control: AbstractControl): ValidationErrors | null {
  return null;
}

// No-op CLABE validator
export function clabeValidator(control: AbstractControl): ValidationErrors | null {
  return null;
}

// No-op cross-field validator for factor/importe depending on formaAplicacion
export function factorImporteValidator(): ValidatorFn {
  return (_group: AbstractControl): ValidationErrors | null => null;
}

// No-op cross-field validator for vigencia range (inicio/fin)
export function vigenciaRangoValidator(): ValidatorFn {
  return (_group: AbstractControl): ValidationErrors | null => null;
}

