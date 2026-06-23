import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CalendarioService } from '../../../core/services/calendario.service';
import { MatDialog } from '@angular/material/dialog';
import { Calendario } from '../../../models/calendario.model';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { AltaCalendarioDialog } from '../../../shared/dialogs/alta-calendario-dialog/alta-calendario-dialog';

@Component({
  selector: 'app-gestion-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './gestion-calendario.html',
  styleUrl: './gestion-calendario.css'
})
export class GestionCalendario {

  private readonly calendarioService = inject(CalendarioService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  displayedColumns: string[] = ['ejercicio','qna','tipo', 'fechaCierre','fechaPago','movimientos', 'pension', 'juicios', 'terceros', 'activa'];
  dataSource = new MatTableDataSource<Calendario>([]);
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;

  ngOnInit(): void {
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    this.calendarioService.getCalendarioQna().subscribe({
      next: (res) => {
        this.dataSource.data = res.data ?? [];
        this.totalRecords = this.dataSource.data.length;
        this.dataSource.paginator = this.paginator;
        this.cdr.markForCheck();
      },
      error: () => this.mostrarResultado(false, 'Error al cargar el calendario'),
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cdr.markForCheck();
  }

  openDialog(): void {
    const formRef = this.dialog.open(AltaCalendarioDialog, { width: '520px' });
    formRef.afterClosed().subscribe((payload) => {
      if (!payload) return; 
      this.calendarioService.addCalendario(payload).subscribe({
        next: (res) => {
          this.mostrarResultado(
            res.success,
            res.success
              ? 'El calendario se guardó correctamente.'
              : (res.message ?? 'No se pudo guardar el calendario.')
          );

          if (res.success) this.cargarCalendario();
        },
        error: () => this.mostrarResultado(false, 'Error al guardar el calendario.'),
      });
    });
  }

  private mostrarResultado(success: boolean, message: string): void {
      this.dialog.open(ConfirmDialog, {
        width: '400px',
        data: {
          title: success ? 'Success' : 'Error',
          message: message,
          confirmText: 'Accept',
        }
      });
  }
}

