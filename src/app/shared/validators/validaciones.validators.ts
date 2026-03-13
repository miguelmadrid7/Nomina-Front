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

export function factorImporteControlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.parent) return null;

    const forma = control.parent.get('formaAplicacion')?.value;
    const raw = control.value;

    // Si está vacío, deja que el 'required' lo maneje
    if (raw === null || raw === undefined || raw === '') return null;

    // Normaliza a string para pruebas
    const texto = String(raw).trim();

    if (forma === 'P') {
      // Solo enteros 0-100 y hasta 3 dígitos
      if (!/^\d{1,3}$/.test(texto)) {
        return { factorNoEntero: true }; // ej. contener punto o más de 3 dígitos
      }
      const n = Number(texto);
      if (Number.isNaN(n)) return { numeroInvalido: true };
      if (n < 0) return { factorMin: true };
      if (n > 100) return { factorMax: true };
      return null;
    }

    if (forma === 'C') {
      // Importe positivo o cero (permitir decimales)
      const n = Number(texto);
      if (Number.isNaN(n)) return { numeroInvalido: true };
      if (n < 0) return { importeNegativo: true };
      return null;
    }

    // Si no hay formaAplicacion aún, no marcamos error
    return null;
  };
}
