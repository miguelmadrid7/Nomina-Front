import { Component } from '@angular/core';
import { NominaService } from '../../../services/nomina-ordinaria.service';

@Component({
  selector: 'app-generar-producto',
  standalone: true,
  imports: [

  ],
  templateUrl: './generar-producto.component.html',
  styleUrl: './generar-producto.component.css'
})
export class GenerarProductoComponent {

  constructor(private nominaService: NominaService) {}

  //Anexo V
  descargarCSVAnexoV() {
  this.nominaService.exportarChequesCSV().subscribe({
    next: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Anexo V.csv'; // o toma el nombre del header si quieres
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err: any) => {
      console.error('Error descargando CSV de cheques', err);
      }
    });
  }

  //ANEXO VI
  descargarCSVAnexoVI() {
    this.nominaService.exportarConceptosCSV().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Anexo-VI.csv'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error descargando CSV', err);
      }
    });
  }






}
