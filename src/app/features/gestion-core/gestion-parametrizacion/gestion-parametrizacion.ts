import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ParametrizacionResponse } from '../../../models/response/parametrizacion-response.model';
import { ParametrizacionService } from '../../../core/services/parametrizacion.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiResponse } from '../../../models/response/api-Response.model';
import { AltaParametrizacionDialog } from '../../../shared/dialogs/alta-parametrizacion-dialog/alta-parametrizacion-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-gestion-parametrizacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './gestion-parametrizacion.html',
  styleUrl: './gestion-parametrizacion.css'
})
export class GestionParametrizacion implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly parametrizacionService = inject(ParametrizacionService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly dataSource = new MatTableDataSource<ParametrizacionResponse>([]);

  displayedColumns: string[] = [
    'anio', 
    'importeDiario', 
    'importeMensual',
    'qnaInicio', 
    'qnaFin', 
    'actions'
  ];

  totalElements = 0;
  loading = false;

  ngOnInit(): void {
    Promise.resolve().then(() => this.getAllParam());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  getAllParam(): void {
    this.loading = true;
    this.parametrizacionService.getAllParam().subscribe({
      next: (resp: ApiResponse<ParametrizacionResponse[]>) => {
        this.dataSource.data = resp.data ?? [];
        this.totalElements = this.dataSource.data.length;
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.totalElements = 0;
        this.loading = false;
        this.snackBar.open('No se cargaron correctamente los datos', 'Cerrar', { duration: 4000 });
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AltaParametrizacionDialog, {
      width: '750px', 
      maxWidth: '95vw',
      data: { mode: 'create' }
    });
    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) this.getAllParam();
    });
  }

  openUpdateDialog(param: ParametrizacionResponse): void {
    const dialogRef = this.dialog.open(AltaParametrizacionDialog, {
      width: '750px', 
      maxWidth: '95vw',
      data: { mode: 'update', param }
    });
    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) this.getAllParam();
    });
  }

  softDeleteParam(paramId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      disableClose: true,
      data: {
        title: 'Eliminar parámetro',
        message: '¿Seguro que deseas eliminar este parámetro?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.loading = true;
      this.parametrizacionService.softDeleteParam(paramId)
        .subscribe({
          next: () => {
            this.getAllParam();
            this.dialog.open(ConfirmDialog, {
              width: '360px',
              data: {
                title: 'Operación exitosa',
                message: 'Parámetro eliminado correctamente.',
                confirmText: 'Aceptar'
              }
            });
          },
          error: () => {
            this.dialog.open(ConfirmDialog, {
              width: '360px',
              data: {
                title: 'Error',
                message: 'No se pudo eliminar el parámetro. Intenta de nuevo.',
                confirmText: 'Aceptar',
                type: 'error'
              }
            });
          }
        }).add(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
    });
  }
}