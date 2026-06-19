import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IconoDialog } from '../../../shared/dialogs/alta-icono-dialog/alta-icono-dialog';
import { PensionAlimenDialog } from '../../pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';

@Component({
  selector: 'app-gestion-icono',
  standalone: true,
  imports: [
    MatIconModule,
  ],
  templateUrl: './gestion-icono.html',
  styleUrl: './gestion-icono.css'
})
export class GestionIcono {

  private readonly dialog = inject(MatDialog);

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
    this.dialog.open(PensionAlimenDialog, {
      width: '420px',
      disableClose: true,
      data: {
        type: 'success',
        message: 'El icono se guardó correctamente.'
      }
    });
  }
}