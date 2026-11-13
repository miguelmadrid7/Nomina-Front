import { Injectable } from "@angular/core";
import * as XLSX from 'xlsx';

const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_EXCEL_MIME_TYPES = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
];

export const PERCEPCIONES_REQUIRED_COLUMNS = ['RFC', 'CURP', 'CONCEPTO', 'IMPORTE', 'CANTIDAD'];


@Injectable({
    providedIn: 'root',
})
export class ExcelUploadService {

    validate(file: File): string | null {
        const hasAllowedExtension = ALLOWED_EXCEL_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext),
        );
        const hasAllowedMimeType = ALLOWED_EXCEL_MIME_TYPES.includes(file.type);
        if(!hasAllowedExtension && !hasAllowedMimeType) {
            return 'Solo se permiten archivos Excel(.xlsx, xls)';
        }
        if(file.size === 0) {
            return 'El archivo seleccionado esta vacio';
        }
        return null;
    }

    validateRequiredColumns(
        file: File,
        requiredColumnsInOrder: string[] = PERCEPCIONES_REQUIRED_COLUMNS): Promise<string | null> {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target?.result as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array'});
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];

                        const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {header: 1});

                        if(rows.length === 0) {
                            resolve('El archivo no contiene datos');
                            return;
                        }

                        const headerRow = rows[0].map((col) => String(col ?? '').trim().toUpperCase());

                        const errores: string[] = [];
                        requiredColumnsInOrder.forEach((expectedColumn, index) => {
                            const actualColumn = headerRow[index] ?? '';
                            if (actualColumn !== expectedColumn.toUpperCase()) {
                                errores.push(
                                    `Columna ${index + 1}: se esperaba "${expectedColumn}" pero se encontró "${actualColumn || '(vacío)'}"`,
                                );
                            }
                        });

                        if (errores.length > 0) {
                            resolve(`El orden de las columnas no coincide con el formato esperado. ${errores.join(' | ')}`);
                            return;
                        }

                        resolve(null);
                    } catch {
                            resolve('No se pudo leer el contenido del archivo. Verifica que sea un Excel válido.');
                    }
                    };
                        reader.onerror = () => {
                            resolve('Ocurrió un error al leer el archivo.');
                        };

            reader.readAsArrayBuffer(file);
        });
    }
}