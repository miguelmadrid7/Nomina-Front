import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { ParametrizacionService } from '../../../core/services/parametrizacion.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AltaParametrizacionDialog } from '../../../shared/dialogs/alta-parametrizacion-dialog/alta-parametrizacion-dialog';
import { ConfirmDialog } from '../../../shared/dialogs/confirm-dialog/confirm-dialog';

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
export class GestionParametrizacion {

  displayedColumns: string[] = ['anio','importeDiario','importeMensual','qnaInicio','qnaFin','actions'];
  parametrizacion: any[] = [];
  totalElements = 0;
  loading = false;


  constructor(private parametrizacionService: ParametrizacionService, private zone: NgZone, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef, private dialog: MatDialog,) {}

  ngOnInit(): void {
    this.getAllParam();
  }

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

  getAllParam(): void {
    this.loading = true;
    this.parametrizacionService.getAllParam().subscribe({
      next: (resp: any ) => {
        this.parametrizacion = resp.data ?? [];
        this.totalElements = this.parametrizacion.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {

        this.totalElements = 0;
        this.loading = false; 
        this.showSnack('No se cargaron correctamente los datos', 'Cerrar', 4000);
      }
    })
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AltaParametrizacionDialog, {
      width: '700px',
      maxWidth: '95vw',
        data: {
          mode: 'create'
        }
    });

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) {
        this.getAllParam();
      }
    });
  }

  openUpdateDialog(param: any): void {
    const dialogRef = this.dialog.open(AltaParametrizacionDialog, {
      width: '700px',
      maxWidth: '95vw',
        data: {
          mode: 'update', param
        }
    });

    dialogRef.afterClosed().subscribe((refresh: boolean) => {
      if (refresh) {
        this.getAllParam();
      }
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
      if (!confirmed) {
        return;
      }
      this.loading = true;
      this.parametrizacionService.softDeleteParam(paramId).subscribe({
        next: () => {
          this.getAllParam();
          this.openSuccessDialog(
            'Parámetro eliminado correctamente'
          );
        },
        error: () => {
          this.loading = false;
          this.openSuccessDialog(
            'No se pudo eliminar el parámetro'
          );
        }
      });
    });
  }

  private openSuccessDialog(message: string): void {
    this.dialog.open(ConfirmDialog, {
      width: '400px',
      disableClose: true,
        data: {
          title: 'Operación exitosa',
          message,
          confirmText: 'Aceptar'
        }
    });
  }
}
