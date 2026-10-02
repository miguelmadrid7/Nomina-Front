import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { Calendario } from '../../../core/model/calendario.model';
import { Icon } from '../../../core/model/gestion-core/icon.model';
import { CalendarioService } from '../../../core/services/calendario.service';
import { IconService } from '../../../core/services/icon.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconoDialog } from '../../../shared/dialogs/alta-icono-dialog/alta-icono-dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

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
export class GestionIcono implements OnInit, OnDestroy {

  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  private readonly calendarioService = inject(CalendarioService);
  private readonly iconService = inject(IconService);
  private readonly cd = inject(ChangeDetectorRef);

  cargandoQna = false;
  calendarioActual: Calendario | null = null;
  errorQna = false;
  icons: Icon[] = [];
  cargandoIconos = false;
  pagedIcons: Icon[] = [];
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;

  readonly displayedColumns: string[] = ['figura', 'icon', 'name', 'description'];

  ngOnInit(): void {
    this.loadQnaActivated();
    this.loadIcons();
  }

  ngOnDestroy(): void {
    this.dialog.closeAll();
  }

  loadQnaActivated(): void {
    this.cargandoQna = true;
    this.errorQna = false;
    this.calendarioService.getQnaActiva().subscribe({
      next: (resp) => {
        this.calendarioActual = resp?.data ?? null;
        this.cargandoQna = false;
        this.errorQna = !this.calendarioActual;
        this.cd.markForCheck();
      },
      error: () => {
        this.calendarioActual = null;
        this.cargandoQna = false;
        this.errorQna = true;
        this.cd.markForCheck();
      }
    });
  }

  loadIcons(): void {
    this.cargandoIconos = true;
    this.iconService.getIcons()
      .pipe(finalize(() => {
        this.cargandoIconos = false;
        this.cd.markForCheck();
      }))
      .subscribe({
       next: (icons) => {
        this.icons = icons;
        this.pageIndex = 0;
        this.refreshPage();
      },
        error: () => this.toastService.error('Error', 'No se pudieron cargar los íconos.'),
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(IconoDialog, {
      width: '750px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.toastService.info('Operación exitosa', 'El icono se guardó correctamente.', 6000);
        this.loadIcons(); 
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.refreshPage();
  }

  private refreshPage(): void {
    this.totalElements = this.icons.length;
    const start = this.pageIndex * this.pageSize;
    this.pagedIcons = this.icons.slice(start, start + this.pageSize);
  }
}