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

  /* Helper de grafica */ 
  export const COLOR_NO   = '#ef4444'; 
  export const COLOR_WARN = '#f59e0b'; 
  export const COLOR_OK   = '#2563eb'; 

  // Clamp de 0 a 100
  export function clampPercent(p: number): number {
    if (Number.isNaN(p)) return 0;
    return Math.max(0, Math.min(100, p));
  }

  export function getColorForPercent(percent: number): string {
    const p = clampPercent(percent);
    if (p <= 0)  return COLOR_NO;
    if (p < 50)  return COLOR_WARN;
    return COLOR_OK;
  }

  // Si puedes, tipar con ApexOptions de ng-apexcharts
  // import { ApexOptions } from 'ng-apexcharts';
  export function withChartPercent(chartOptions: any, percent: number): any {
    const p = clampPercent(percent);
    const color = getColorForPercent(p);
    return {
      ...chartOptions,
      series: [p],
      colors: [color],
    };
  }

  export function shouldBoldLegendItem(percent: number): boolean {
    return clampPercent(percent) <= 0;
  }