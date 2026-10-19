import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './forbidden-dialog.html',
  styleUrl: './forbidden-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForbiddenDialog {}