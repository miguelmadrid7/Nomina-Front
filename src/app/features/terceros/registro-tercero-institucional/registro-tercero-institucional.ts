import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UppercaseDirective } from '../../../shared/directives/upperCase.directivas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmpleadoItem } from '../../../models/emplado.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NominaRow } from '../../../models/nomina-Row.model';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { PensionAlimenDialog } from '../../nomina/pension-alimen-dialog/pension-alimen-dialog';
import { DialogTerceroInstitucional } from '../../../shared/dialogs/dialog-tercero-institucional/dialog-tercero-institucional';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-registro-tercero-institucional',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    UppercaseDirective 
  ],
  templateUrl: './registro-tercero-institucional.html',
  styleUrl: './registro-tercero-institucional.css'
})
export class RegistroTerceroInstitucional {

  form!: FormGroup;
  resultado: EmpleadoItem[] = [];
  cargandoBusqueda = false;
  totalElements = 0;
  displayedColumns: string[] = [ 'rfc', 'nombreCompleto', 'tipoMovimiento', 'acciones'];
  dataSource = new MatTableDataSource<NominaRow>([]);
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator?: MatPaginator;

  constructor(
    private fb: FormBuilder, 
    private snackBar: MatSnackBar, 
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
    private terceroService: TerceroService
  ) {}

  private showSnack(message: string, action: string, duration: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zone.run(() => this.snackBar.open(message, action, { duration }));
      }, 50);
    });
  }

   ngOnInit() {
     this.form = this.fb.group({ 
       busqueda: this.fb.group({
        empleadoId: [null],
        searchText: ['']
        }),
      });
   }

  buscarEmpleado() {
      const value = this.form.get('busqueda.searchText')?.value;
      if (value && typeof value === 'object') return;
  
      const texto = typeof value === 'string' ? value.trim() : '';
      if (!texto) {
        this.resultado = [];
        this.autocompleteTrigger?.closePanel();
        this.showSnack('Captura un criterio de busqueda', 'Cerrar', 4000);
        return;
      }

      if (texto.length < 3) {
        this.resultado = [];
        this.autocompleteTrigger?.closePanel();
        this.showSnack('Captura almenos 3 caractares para buscar', 'Cerrar', 4000);
        return;
      }
  
      this.cargandoBusqueda = true;
      this.terceroService.searchEmployees(texto).subscribe({
        next: (lista: EmpleadoItem[]) => {
          this.resultado = (lista ?? []).filter(e => {
            const rfc = (e.rfc ?? e.RFC ?? '').trim();
            const curp = (e.curp ?? e.CURP ?? '').trim();
            const pa = (e.primerApellido ?? e.primer_apellido ?? '').trim();
            const sa = (e.segundoApellido ?? e.segundo_apellido ?? '').trim();
            const nombre = (e.nombre ?? '').trim();
            const empleadoStr = (e.empleado ?? '').trim();
            const nombreCompleto = (e.nombreCompleto ?? '').trim();
  
            return !!(rfc || curp || pa || sa || nombre || empleadoStr || nombreCompleto);
          });
  
          this.cargandoBusqueda = false;
            if (this.resultado.length > 0) {
              setTimeout(() => this.autocompleteTrigger?.openPanel());
            } else {
              this.autocompleteTrigger?.closePanel();
            }
        },
        error: () => {
          this.cargandoBusqueda = false;
          this.showSnack('Error en la busqueda', 'Cerrar', 4000);
        }
      });
  }

  displayEmpleado(emp: EmpleadoItem | string | null): string {
      if (!emp) return '';
      if (typeof emp === 'string') return emp;

      const rfc = (emp.rfc ?? emp.RFC ?? '').trim();

      const fullName = [
        emp.primerApellido ?? emp.primer_apellido ?? '',
        emp.segundoApellido ?? emp.segundo_apellido ?? '',
        emp.nombre ?? ''
      ].map(x => x.trim()).filter(Boolean).join(' ');

      const etiqueta = (emp.nombreCompleto ?? '').trim() || fullName || (emp.empleado ?? '').trim();
      return [rfc, etiqueta].filter(Boolean).join(' - ');
  }

  empleadoSeleccionado(emp: EmpleadoItem): void {
      let rfc = (emp.rfc ?? emp.RFC ?? '').trim();
      let curp = (emp.curp ?? emp.CURP ?? '').trim();
      let nombre = (emp.nombreCompleto ?? '').trim();

        if (!nombre) {
          const fullName = [
            emp.primerApellido ?? emp.primer_apellido ?? '',
            emp.segundoApellido ?? emp.segundo_apellido ?? '',
            emp.nombre ?? ''
          ].map(x => x.trim()).filter(Boolean).join(' ');
          nombre = fullName.trim();
        }

      const empleadoStr = (emp.empleado ?? '').trim();
        if (empleadoStr) {
          const parts = empleadoStr.split(' - ').map(p => p.trim());
          if (!rfc && parts.length >= 1) rfc = parts[0] ?? '';
          if (!curp && parts.length >= 2) curp = parts[1] ?? '';
          if (!nombre && parts.length >= 3) nombre = parts.slice(2).join(' - ').trim();
        }

      const row: any = {
        rfc,
        curp,
        nombreEmpleado: nombre
      };

      this.dataSource.data = [row];
      this.totalElements = 1;
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
  }

   verDetalles(row: any) {
      const nombreCompleto = (row.nombreEmpleado || '').trim().split(' ');
      const apellidoPaterno = nombreCompleto[0] || '';
      const apellidoMaterno = nombreCompleto[1] || '';
      const nombres = nombreCompleto.slice(2).join(' ') || '';
      const detalles = (row.detalles && row.detalles.length)
        ? row.detalles
        : (this.dataSource.data as NominaRow[])
            .filter(d => d.noComprobante === row.noComprobante && d.rfc === row.rfc && d.curp === row.curp)
            .map(d => ({
              noComprobante: d.noComprobante,
              tipoConcepto: d.tipoConcepto,
              concepto: d.concepto,
              importe: Number(d.importe) || 0,
            }));
  
      const dialogRef = this.dialog.open(DialogTerceroInstitucional, {
        width: '1200px',
        maxWidth: '92vw',
        maxHeight: '90vh',
        panelClass: 'terceros-dialog-panel',
        autoFocus: false,
          data: {
            rfc: row.rfc,
            curp: row.curp,
            apellidoPaterno,
            apellidoMaterno,
            nombres,
            numeroDocumento: row.numeroDocumento,
            tipoOrden: row.tipoOrden,
            importeMensual: row.importeMensual,
            estatus: row.estatus,
            detalles
          }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;
          this.terceroService.guardarTercero(result).subscribe({
            next: () => {
              this.dialog.open(PensionAlimenDialog, {
                width: '500px',
                disableClose: true,
                data: {
                  mensaje: 'Se guardó correctamente' 
                }
              });
            },
            error: (err) => {
              this.showSnack('Error al guardar', 'Cerrar', 4000);
            }
          });
      });
    }

  clearFilters(): void {
    this.form.patchValue({
      busqueda: {
        searchText: '',
        empleadoId: null,
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      },
      empleado: {
        rfc: '',
        primerApellido: '',
        segundoApellido: '',
        nombre: ''
      }
    }, { emitEvent: false });
      this.resultado = [];
      this.autocompleteTrigger?.closePanel();
      this.dataSource.data = [];
      
      this.totalElements = 0;
    
      this.paginator?.firstPage?.();
      this.cd.markForCheck();
  }

}
