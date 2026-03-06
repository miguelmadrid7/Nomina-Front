import { Component, NgZone } from '@angular/core';
import { NominaService } from '../../../core/services/nomina-ordinaria.service';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-generar-producto',
  standalone: true,
  imports: [
    MatSnackBarModule,

  ],
  templateUrl: './generar-producto.component.html',
  styleUrl: './generar-producto.component.css'
})
export class GenerarProductoComponent {

  constructor(
    private nominaService: NominaService, 
    private loaderService: LoaderService, 
    private snackBar: MatSnackBar,
    private zone: NgZone) {}

  // Agregar este método helper a la clase
  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }


  //Anexo V
  descargarCSVAnexoV() {
    this.loaderService.show();

    this.nominaService.exportarAnexoV().pipe(
      finalize (() => this.loaderService.hide())
    )
  
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Anexo V.csv'; // o toma el nombre del header si quieres
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showSnack('Error al descargar el anexo V', 'Cerrar', 4000);

      }
      });
  }

  //ANEXO VI
  descargarCSVAnexoVI() {
    this.loaderService.show();
  
    this.nominaService.exportarAnexoVI().pipe(
      finalize(() => this.loaderService.hide())
    )
    .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Anexo-VI.csv'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showSnack('Error al descargar el anexo VI', 'Cerrar', 4000);
      }
    });
  }






}
