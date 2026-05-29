/* Helper de busquedas */
export function esRFC(valor: string): boolean {
  const moral = /^[A-Z&Ñ]{3}\d{6}[A-Z0-9]{3}$/;
  const fisica = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/;
  valor = valor.toUpperCase().trim();
  return valor.length === 12 ? moral.test(valor) : valor.length === 13 ? fisica.test(valor) : false;
}

export function esCURP(valor: string): boolean {
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  return curpRegex.test(valor.toUpperCase().trim());
} 