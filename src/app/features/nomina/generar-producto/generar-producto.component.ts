import { Component, inject } from '@angular/core';
import { NominaService } from '../../../core/services/nomina-ordinaria.service';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-generar-producto',
  standalone: true,
  imports: [],
  templateUrl: './generar-producto.component.html',
  styleUrl: './generar-producto.component.css'
})
export class GenerarProductoComponent {

    private readonly nominaService = inject(NominaService);
    private readonly loaderService = inject(LoaderService);
    private readonly toastService = inject(ToastService);




  descargarCSVAnexoV() {
    this.loaderService.show();
    this.nominaService.exportarAnexoV().pipe(
      finalize (() => this.loaderService.hide())
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Anexo V.csv'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Error', 'Error al descargar el anexo V', 4000);

      }
      });
  }

  descargarCSVAnexoVI() {
    this.loaderService.show();
    this.nominaService.exportarAnexoVI().pipe(
      finalize(() => this.loaderService.hide())
    ) .subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Anexo-VI.csv'; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Error', 'Error al descargar el anexo VI', 4000);
      }
    });
  }
}
