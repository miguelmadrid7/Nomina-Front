import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IconoDialog } from '../../../shared/dialogs/icono-dialog/icono-dialog';
import { PensionAlimenDialog } from '../../pension-alimenticia/pension-alimen-dialog/pension-alimen-dialog';

@Component({
  selector: 'app-gestion-icono',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    
  ],
  templateUrl: './gestion-icono.html',
  styleUrl: './gestion-icono.css'
})
export class GestionIcono {

  constructor(private dialog: MatDialog) {}

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