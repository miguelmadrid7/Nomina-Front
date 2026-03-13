export interface BeneficiarioNom {
    rfc: string;
    nombreCompleto: string;
    importeTotal: number | null;
    formaAplicacion: 'P' | 'C' | string;
    qnaProceso: string;
    citaBancaria: number;
    clabeInterbancaria: number;
    institucionBancaria: string;
}