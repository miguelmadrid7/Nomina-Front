import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function vigenciaFormatoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const texto = value.toString();
    // Solo números
    if (!/^\d+$/.test(texto)) {
      return { soloNumeros: true };
    }
    // máximo 6 dígitos
    if (texto.length > 6) {
      return { max6Digitos: true };
    }
    return null;
  };
}

export function factorImporteValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const forma = group.get('formaAplicacion')?.value;
    const factor = group.get('factorImporte')?.value;
    if (factor == null) return null;
    const numero = Number(factor);
    if (isNaN(numero)) {
      return { numeroInvalido: true };
    }
    // porcentaje
    if (forma === 'P' && numero > 100) {
      return { porcentajeMaximo: true };
    }
    // importe fijo
    if (forma === 'C' && numero < 0) {
      return { importeNegativo: true };
    }
    return null;
  };
}


