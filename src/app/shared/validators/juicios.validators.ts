import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

// RFC (simplificado persona física): 13 caracteres
export function rfcValidator(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '').toUpperCase().trim();
  if (!v) return null; // dejar que 'required' lo marque cuando aplique
  const ok = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(v);
  return ok ? null : { rfc: true };
}

// CLABE: exactamente 18 dígitos numéricos
export function clabeValidator(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '').trim();
  if (!v) return null; // dejar que 'required' lo marque cuando aplique
  const ok = /^\d{18}$/.test(v);
  return ok ? null : { clabe: true };
}

// Valida coherencia entre formaAplicacion y factorImporte dentro del grupo 'descuento'
export function factorImporteValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fg = group as FormGroup;
    const forma = fg.get('descuento.formaAplicacion')?.value ?? fg.get('formaAplicacion')?.value;
    const factorRaw = fg.get('descuento.factorImporte')?.value ?? fg.get('factorImporte')?.value;
    if (forma == null) return null;
    const num = Number(factorRaw);
    if (isNaN(num)) return { factorImporte: true };

    if (forma === 'P') {
      // porcentaje 0 < x <= 100
      if (!(num > 0 && num <= 100)) return { factorImporte: true };
    } else if (forma === 'C') {
      if (num < 0) return { factorImporte: true };
    }
    return null;
  };
}

// Valida rango AAAAQQ: inicio <= fin
export function vigenciaRangoValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const fg = group as FormGroup;
    const ini = String(fg.get('vigencia.inicio')?.value ?? fg.get('inicio')?.value ?? '').trim();
    const fin = String(fg.get('vigencia.fin')?.value ?? fg.get('fin')?.value ?? '').trim();
    if (!ini || !fin) return null; // otros validators de required aplican
    const rx = /^\d{6}$/;
    if (!rx.test(ini) || !rx.test(fin)) return { vigenciaFormato: true };
    const nIni = Number(ini);
    const nFin = Number(fin);
    return nIni <= nFin ? null : { vigenciaRango: true };
  };
}

