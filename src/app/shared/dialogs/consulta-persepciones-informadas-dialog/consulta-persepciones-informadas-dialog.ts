import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { LoteResumen } from '../../../core/model/carga-excel/lote-resumen.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ToastService } from '../../../core/services/toast.service';
import { PercepcionesInformadasService } from '../../../core/services/percepciones-informadas.service';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-consulta-persepciones-informadas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule,
    MatIconModule,
    MatTableModule,     
    MatPaginatorModule,
    

  ],
  templateUrl: './consulta-persepciones-informadas-dialog.html',
  styleUrl: './consulta-persepciones-informadas-dialog.css'
})
export class ConsultaPersepcionesInformadasDialog {

  private readonly dialogRef = inject(MatDialogRef<ConsultaPersepcionesInformadasDialog>);
  private readonly toastService = inject(ToastService)
  private readonly dialog = inject(MatDialog);
  private readonly percepcionesInformadasService = inject(PercepcionesInformadasService)
  
  readonly displayedColumns: string[] = ['conceptoDescuento', 'qnaProceso', 'totalFilas', 'aceptadas', 'rechazadas', 'pendientesValidar', 'fechaCarga', 'acciones'];
  dataSource = new MatTableDataSource<LoteResumen>([]);
  showRecords = false;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: { lotes: LoteResumen[] }) {
    this.dataSource.data = data.lotes;
    this.showRecords = data.lotes.length > 0;
  }

   onBorrarLote(lote: LoteResumen): void {
    const ref = this.dialog.open(ConfirmDialog, {
      width: '420px',
      data: {
        title: 'Eliminar lote',
        message: `¿Eliminar el lote completo de "${lote.conceptoDescuento}" (quincena ${lote.qnaProceso})? Se borrarán ${lote.totalFilas} registro(s). Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    // WHY afterClosed().subscribe en vez de leer el valor directo:
    // MatDialogRef.close(true/false) emite ese valor de forma
    // asíncrona una vez que el usuario interactúa — es el patrón
    // estándar para esperar la decisión del usuario en un modal.
    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) {
        return;
      }

      this.percepcionesInformadasService.deleteLote(lote.qnaProceso, lote.conceptoDescuento).subscribe({
        next: (response) => {
          if (!response.success) {
            this.toastService.error('No se pudo eliminar', response.message ?? 'Ocurrió un error.');
            return;
          }

          this.toastService.success('Lote eliminado', response.message ?? 'El lote se eliminó correctamente.');
          this.dataSource.data = this.dataSource.data.filter(
            (item) => !(item.conceptoDescuento === lote.conceptoDescuento && item.qnaProceso === lote.qnaProceso),
          );
          this.showRecords = this.dataSource.data.length > 0;
        },
        error: (error) => {
          this.toastService.error('Error', error?.error?.message ?? 'No se pudo eliminar el lote.');
        },
      });
    });
  }
    

  close(): void {
    this.dialogRef.close();
  }
}
