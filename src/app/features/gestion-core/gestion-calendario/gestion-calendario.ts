import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewChild, ɵAcxChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CalendarioService } from '../../../core/services/calendario.service';
import { MatDialog } from '@angular/material/dialog';
import { Calendario } from '../../../core/model/calendario.model';
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
  styleUrl: './gestion-calendario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionCalendario {

  private readonly calendarioService = inject(CalendarioService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  displayedColumns: string[] = ['ejercicio','qna','tipo', 'fechaCierre','fechaPago','movimientos', 'pension', 'juicios', 'terceros', 'activa', 'acciones'];
  dataSource = new MatTableDataSource<Calendario>([]);
  qnaActiva = 0;
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;

  ngOnInit(): void {
    this.cargarCalendario();
  }

  cargarCalendario(mantenerPagina = false): void {
    const paginaActual = mantenerPagina ? this.pageIndex : 0;
    this.calendarioService.getCalendarioQna().subscribe({
        next: (res) => {
            this.dataSource.data = res.data ?? [];
            this.totalRecords = this.dataSource.data.length;
            this.dataSource.paginator = this.paginator;
            const activa = this.dataSource.data.find(c => c.activa);
            this.qnaActiva = activa?.qna ?? 0;
            if (mantenerPagina && this.paginator) {
                setTimeout(() => {
                    this.paginator.pageIndex = paginaActual;
                    this.dataSource.paginator = this.paginator;
                    this.cdr.detectChanges();
                });
            }
            this.cdr.markForCheck();
        },
        error: () => this.mostrarResultado(false, 'Error al cargar el calendario'),
    });
  }

  openDialog(): void {
    const formRef = this.dialog.open(AltaCalendarioDialog, { 
      width: '850px',
      maxWidth: '95vw',
    });
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

  openEditDialog(calendario: Calendario): void {
    this.calendarioService.getCalendarioById(calendario.id).subscribe({
      next: (res) => {
        const formRef = this.dialog.open(AltaCalendarioDialog, {
          width: '850px',
          maxWidth: '95vw',
          data: res.data  
        });
        formRef.afterClosed().subscribe((payload) => {
          if (!payload) return;
          this.calendarioService.updateCalendario(calendario.id, payload).subscribe({
            next: (updateRes) => {
              this.mostrarResultado(
                updateRes.success,
                updateRes.success ? 'Calendario actualizado con exito' : (updateRes.message ?? 'Fallo al actualizar calendario') 
              );
              if (updateRes.success) this.cargarCalendario(true);
            },
            error: () => this.mostrarResultado(false, 'Fallo al actualizar'),
          });
        });
      },
      error: () => this.mostrarResultado(false, 'Error al cargar calendario'),
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

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cdr.detectChanges();
  }
}

