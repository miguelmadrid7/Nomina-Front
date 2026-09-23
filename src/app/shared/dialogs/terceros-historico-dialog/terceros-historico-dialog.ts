import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TercerosHistoricoDialogData } from '../../../core/model/terceros/terceros-historico-dialog-data.model';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { TerceroHistorico } from '../../../core/model/terceros/tercero-historico.model';

@Component({
  selector: 'app-terceros-historico-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './terceros-historico-dialog.html',
  styleUrl: './terceros-historico-dialog.css'
})
export class TercerosHistoricoDialog {

  private readonly ref = inject<MatDialogRef<TercerosHistoricoDialog>>(MatDialogRef);
  readonly data = inject<TercerosHistoricoDialogData>(MAT_DIALOG_DATA);

  pagedRows: TerceroHistorico[] = [];
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  readonly displayedColumns: string[] = ['catConceptoCve', 'qnaProceso', 'fechaCarga'];

  ngOnInit(): void {
    this.refreshPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.refreshPage();
  }

  close(): void {
    this.ref.close();
  }

  private refreshPage(): void {
    this.totalElements = this.data.historico.length;
    const start = this.pageIndex * this.pageSize;
    this.pagedRows = this.data.historico.slice(start, start + this.pageSize);
  }

}
