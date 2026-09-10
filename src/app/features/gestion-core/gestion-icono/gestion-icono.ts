import { Component, inject, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IconoDialog } from '../../../shared/dialogs/alta-icono-dialog/alta-icono-dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-gestion-icono',
  standalone: true,
  imports: [
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './gestion-icono.html',
  styleUrl: './gestion-icono.css'
})
export class GestionIcono implements OnDestroy {

  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(IconoDialog, {
      width: '750px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.openSuccessDialog();
      }
    });
  }

  openSuccessDialog(): void {
    this.toastService.info('Operación exitosa', 'El icono se guardó correctamente.', 6000);
  }
}