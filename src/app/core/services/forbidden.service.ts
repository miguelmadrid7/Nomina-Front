import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ForbiddenDialog } from '../../shared/dialogs/forbidden-dialog/forbidden-dialog';

@Injectable({ providedIn: 'root' })
export class ForbiddenDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);
  private dialogRef: MatDialogRef<ForbiddenDialog> | null = null;

  open(): void {
    if (!isPlatformBrowser(this.platformId) || this.dialogRef) return;

    this.dialogRef = this.dialog.open(ForbiddenDialog, {
      width: '400px',
      maxWidth: '90vw',
      panelClass: 'forbidden-dialog-panel'
    });

    this.dialogRef.afterClosed().subscribe(() => {
      this.dialogRef = null;
    });
  }
}