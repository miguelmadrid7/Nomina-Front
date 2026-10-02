import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NominaService } from '../../../core/services/nomina-ordinaria.service';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';

@Component({
  selector: 'app-generar-producto',
  standalone: true,
  imports: [
    MatIconModule,
  ],
  templateUrl: './generar-producto.component.html',
  styleUrl: './generar-producto.component.css'
})
export class GenerarProductoComponent {

  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;
  


  private readonly nominaService = inject(NominaService);
  private readonly loaderService = inject(LoaderService);
  private readonly calendarioService = inject(CalendarioService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadQnaActivated();
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
        this.calendarioActual = calendario;
        this.cargandoQna = false;
        this.errorQna = !calendario;
        this.cd.detectChanges();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.detectChanges();
      }
    });
  }




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
