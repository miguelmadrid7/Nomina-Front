import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IconoDialog } from '../../../shared/dialogs/alta-icono-dialog/alta-icono-dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ToastService } from '../../../core/services/toast.service';
import { Calendario } from '../../../core/model/calendario.model';
import { CalendarioService } from '../../../core/services/calendario.service';

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
export class GestionIcono implements OnDestroy, OnInit{

  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly calendarioService = inject(CalendarioService);
  private readonly cd = inject(ChangeDetectorRef);

  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;

  ngOnInit(): void {
    this.loadQnaActivated();
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        const calendario = resp?.data ?? null;
        this.calendarioActual = calendario;
        this.cargandoQna = false;
        this.errorQna = !calendario;
        this.cd.detectChanges();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.detectChanges();
      }
    });
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