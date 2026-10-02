import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ConsultaTercerosLotesDialogData } from '../../../core/model/terceros/terceros-consulta-dialog-data.model';
import { HttpErrorResponse } from '@angular/common/http';
import { TercerosLote } from '../../../core/model/terceros/terceros-lote.model';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
import { TerceroService } from '../../../core/services/tercero.service';
import { ToastService } from '../../../core/services/toast.service';
import { finalize } from 'rxjs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

const REMOVE_ANIMATION_MS = 300;

@Component({
  selector: 'app-consulta-terceros-lotes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './consulta-terceros-lotes-dialog.html',
  styleUrl: './consulta-terceros-lotes-dialog.css'
})
export class ConsultaTercerosLotesDialog implements OnInit {

  private readonly ref = inject<MatDialogRef<ConsultaTercerosLotesDialog>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  private readonly terceroService = inject(TerceroService);
  private readonly toastService = inject(ToastService);
  private readonly cd = inject(ChangeDetectorRef);
  readonly data = inject<ConsultaTercerosLotesDialogData>(MAT_DIALOG_DATA);

  lotes: TercerosLote[] = [...this.data.lotes];
  pagedLotes: TercerosLote[] = [];
  isDeleting = false;
  removingKey: string | null = null;
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  readonly loteDeleted = output<TercerosLote>();
  readonly displayedColumns: string[] = ['concepto', 'qnaProceso', 'total', 'aceptados', 'rechazados', 'pendientes', 'fechaCarga', 'acciones'];
  readonly activeQna: number | null = this.data.calendarioActual
    ? Number(`${this.data.calendarioActual.ejercicio}${this.data.calendarioActual.qna.toString().padStart(2, '0')}`)
    : null;

  ngOnInit(): void {
    this.refreshPage();
  }

  loteKey(lote: TercerosLote): string {
    return `${lote.qnaProceso}-${lote.concepto}`;
  }

  onDeleteLote(lote: TercerosLote): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '420px',
      maxWidth: '95vw',
      data: {
        title: 'Eliminar lote',
        message: `Se eliminarán ${lote.total} registros del concepto ${lote.concepto} (quincena ${lote.qnaProceso}). Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed !== true) {
        return;
      }
      this.isDeleting = true;
      this.cd.detectChanges();
      this.terceroService.deleteLote(lote.qnaProceso, lote.concepto)
        .pipe(finalize(() => {
          this.isDeleting = false;
          this.cd.detectChanges();
        }))
        .subscribe({
          next: (response) => {
            if (!response.success) {
              this.toastService.error('Error al eliminar', response.message ?? 'No se pudo eliminar el lote.');
              return;
            }
            this.toastService.success('Operación exitosa', `Se eliminaron ${response.data.filasBorradas} registros del lote.`);
            this.loteDeleted.emit(lote);
            this.removingKey = this.loteKey(lote);
            this.cd.detectChanges();
            setTimeout(() => {
              this.lotes = this.lotes.filter((l) => this.loteKey(l) !== this.loteKey(lote));
              this.removingKey = null;
              this.refreshPage();
              this.cd.detectChanges();
            }, REMOVE_ANIMATION_MS);
          },
          error: (error: HttpErrorResponse) => {
            this.toastService.error('Error al eliminar', error?.error?.message ?? 'No se pudo eliminar el lote.');
          },
        });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.refreshPage();
  }

  refreshPage(): void {
    this.totalElements = this.lotes.length;
    const lastPage = Math.max(Math.ceil(this.totalElements / this.pageSize) - 1, 0);
    if (this.pageIndex > lastPage) {
      this.pageIndex = lastPage;
    }
    const start = this.pageIndex * this.pageSize;
    this.pagedLotes = this.lotes.slice(start, start + this.pageSize);
  }

  close(): void {
    this.ref.close();
  }
}