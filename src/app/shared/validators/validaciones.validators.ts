import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function rfcValidator(): ValidatorFn {
  // Persona Moral: 3 letras/&/Ñ + yymmdd + 3 alfanum
  const moral = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
  // Persona Física: 4 letras/&/Ñ + yymmdd + 3 alfanum
  const fisica = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    let value: string = control.value || '';
    if (!value) return null; // manejar 'required' aparte
    value = value.toUpperCase().trim();
    // longitud válida: 12 (moral) o 13 (física)
    if (value.length !== 12 && value.length !== 13) {
      return { rfcLongitud: true };
    }
    // fecha válida (yymmdd) en posiciones 4-9 o 3-8
    const datePart = value.length === 12 ? value.substring(3, 9) : value.substring(4, 10);
    const yy = parseInt(datePart.substring(0, 2), 10);
    const mm = parseInt(datePart.substring(2, 4), 10);
    const dd = parseInt(datePart.substring(4, 6), 10);
    const fechaValida = mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;

    if (!fechaValida) {
      return { rfcFecha: true };
    }
    // regex de formato
    const ok = value.length === 12 ? moral.test(value) : fisica.test(value);
    if (!ok) return { rfcFormato: true };
    return null;
  };
}

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

export function upperCaseValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (!value) return null;
        if (value !== value.toUpperCase()) {
            return { notUpperCase: true };
        }
        return null;
    };
}
