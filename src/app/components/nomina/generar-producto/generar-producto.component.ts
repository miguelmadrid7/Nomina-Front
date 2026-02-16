import { Component } from '@angular/core';
import { NominaService } from '../../../services/nomina-ordinaria.service';

@Component({
  selector: 'app-generar-producto',
  imports: [],
  templateUrl: './generar-producto.component.html',
  styleUrl: './generar-producto.component.css'
})
export class GenerarProductoComponent {

  constructor(private nominaService: NominaService) {}

  descargarCSV() {
    this.nominaService.exportarConceptosCSV().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conceptos_nomina.csv'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error descargando CSV', err);
      }
    });
  }


}
