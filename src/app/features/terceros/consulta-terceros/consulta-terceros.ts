import { ChangeDetectorRef, Component } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NominaRow } from '../../../models/nomina-Row.model';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TerceroService } from '../../../core/services/tercero.service';
import { LoaderService } from '../../../core/services/loader.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './consulta-terceros.html',
  styleUrl: './consulta-terceros.css'
})
export class ConsultaTerceros {

  dataSource = new MatTableDataSource<NominaRow>([]);
  displayedColumns: string[] = [ 'rfc', 'curp', 'nombreCompleto', 'numeroOrden', 'tipoOrden', 'importeMensual', 'concepto', 'qnaProceso', 'estatus'];

  form!: FormGroup;
  filtrosTabla!: FormGroup;
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  concepto: any[] = [];
  totalElements = 0;

   constructor(
    private fb: FormBuilder, 
    private cd: ChangeDetectorRef,
    private terceroService: TerceroService,
    private loaderService: LoaderService,
  ) {}

   ngOnInit() {
    this.form = this.fb.group({ 
      busqueda: this.fb.group({
        concepto: [null]
      }),
    });
    
    this.filtrosTabla = this.fb.group({
        tipoOrden: [null],  
        anio: [null],    
        quincena: [null],
      
    });
    this.cargarConceptos();
  }

  cargarConceptos(){
    this.terceroService.obtenerConceptos().subscribe({
      next: (resp) => {
        const data = resp?.data ?? resp;
        this.concepto = data;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar conceptos:', err);
      }
    });
  }

}
