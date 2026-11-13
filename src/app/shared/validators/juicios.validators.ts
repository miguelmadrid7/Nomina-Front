import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function rfcValidator(control: AbstractControl): ValidationErrors | null {
  const regex = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
  if (!control.value) return null;
  return regex.test(control.value) ? null : { rfcInvalido: true };
}

export function clabeValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value || '').replace(/\D/g, '');
  if (value.length !== 18) return { clabeInvalida: true };

  const pesos = [3,7,1];
  let suma = 0;

  for (let i = 0; i < 17; i++) {
    suma += (Number(value[i]) * pesos[i % 3]) % 10;
  }

  const digito = (10 - (suma % 10)) % 10;

  return digito === Number(value[17]) ? null : { clabeInvalida: true };
}

export function factorImporteValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const forma = form.get('descuento.formaAplicacion')?.value;
    const factor = form.get('descuento.factorImporte')?.value;

    if (!forma || factor == null) return null;

    const numero = Number(factor);
    if (isNaN(numero)) return { factorNoNumerico: true };

    if (forma === 'P') {
      if (!(numero > 0 && numero <= 100)) {
        return { porcentajeInvalido: true };
      }
    }

    if (forma === 'C') {
      if (numero < 0) {
        return { importeNegativo: true };
      }
    }

    return null;
  };
}

export function vigenciaRangoValidator(): ValidatorFn {
  return (form: AbstractControl): ValidationErrors | null => {
    const inicio = Number(form.get('vigencia.inicio')?.value);
    const fin = Number(form.get('vigencia.fin')?.value);

    if (!inicio || !fin) return null;

    return inicio <= fin ? null : { vigenciaInvalida: true };
  };
}

