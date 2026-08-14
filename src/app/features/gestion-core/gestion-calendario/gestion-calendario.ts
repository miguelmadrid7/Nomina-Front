import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CalendarioService } from '../../../core/services/calendario.service';
import { MatDialog } from '@angular/material/dialog';
import { Calendario } from '../../../core/model/calendario.model';
import { AltaCalendarioDialog } from '../../../shared/dialogs/alta-calendario-dialog/alta-calendario-dialog';
import { ToastService } from '../../../core/services/toast.service';

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
  private readonly toastService = inject(ToastService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  displayedColumns: string[] = ['ejercicio','qna','tipo', 'fechaCierre','fechaPago','movimientos', 'pension', 'juicios', 'terceros', 'activa', 'acciones'];
  dataSource = new MatTableDataSource<Calendario>([]);
  allCalendarios: Calendario[] = [];
  qnaActiva = 0;
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;

  ngOnInit(): void {
    this.cargarCalendario();
  }

  cargarCalendario(): void {
    this.calendarioService.getCalendarioQna().subscribe({
        next: (res) => {
          this.allCalendarios = [...(res.data ?? [])];
            this.totalRecords = this.allCalendarios.length;
            this.pageIndex = 0;
            this.applyTableState();
            const activa = this.allCalendarios.find(c => c.activa);
            this.qnaActiva = activa?.qna ?? 0;
            this.cdr.markForCheck();
        },
        error: () => {
          this.allCalendarios = [];
          this.dataSource.data = [];
          this.totalRecords = 0;
          this.toastService.error('Operación inválida', 'Error al cargar el calendario.', 6000);
          this.cdr.markForCheck();
        }
    });
  }

  openDialog(): void {
    const formRef = this.dialog.open(AltaCalendarioDialog, { 
      width: '850px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        mode: 'create'
      }
    });
    formRef.afterClosed().subscribe((payload) => {
      if (!payload) {
        return;
      }  
      
      this.calendarioService.addCalendario(payload).subscribe({
        next: (res) => {
          if(res.success) {
            this.toastService.info('Operación exitosa', 'El calendario se guardó correctamente.', 6000);
            this.cargarCalendario();
          } else {
            this.toastService.error('Operación inválida', res.message ?? 'No se pudo guardar el calendario', 6000);
          }
        },
        error: () => {
          this.toastService.error('Operación inválida', 'Error al guardar el calendario.', 6000);
        }
      });
    });
  }

  openEditDialog(calendario: Calendario): void {
    this.calendarioService.getCalendarioById(calendario.id).subscribe({
      next: (res) => {
        const formRef = this.dialog.open(AltaCalendarioDialog, {
          width: '850px',
          maxWidth: '95vw',
          data: {
            mode: 'update',
            calendario: res.data  
          }
        });
        formRef.afterClosed().subscribe((payload) => {
          if (!payload) { 
            return;
          }
          this.calendarioService.updateCalendario(calendario.id, payload).subscribe({
            next: (updateRes) => {
              if(updateRes.success) {
                this.toastService.info('Operación exitosa', ' El calendario se actualizó correctamente.', 6000);
                this.cargarCalendario();
              } else {
                this.toastService.error('Operación inválida', updateRes.message ?? 'No se pudo actualizar el calendario.', 6000);
              }
            },
            error: () => {
              this.toastService.error('Operación inválida', 'Fallo al actualizar. Intente nuevamente', 6000);
            }
          });
        });
      },
      error: () => {
        this.toastService.error('Operación inválida', 'Error al cargar calendario. Intente nuevamente', 6000);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.applyTableState();
  }

  private applyTableState() {
    const start = this.pageIndex * this.pageSize;
    const end  = start + this.pageSize;
    this.dataSource.data = this.allCalendarios.slice(start, end);
  }
}

