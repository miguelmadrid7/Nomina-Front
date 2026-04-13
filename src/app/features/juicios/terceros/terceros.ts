import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-terceros',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
  ],
  templateUrl: './terceros.html',
  styleUrl: './terceros.css'
})
export class Terceros {

  form!: FormGroup;
  detailForm!: FormGroup;
  anio: number[] = [2026, 2025, 2024];
  quincena: number[] = Array.from({ length: 24 }, (_, i) => i + 1);
  concepto: number[] = [];
  totalElements = 0;
  showRecords = true;

  private filtersReady = true;
  private isRefreshing = false;
  private lastQnaKey: string | null = null;
  private qnaDebounceId: any;

  anioSeleccionado: number | null = null;
  quincenaSeleccionada: number | null = null;
  selectedRow: any;

  displayedColumns: string[] = [ 'rfc', 'nombreCompleto', 'qnaProceso', 'acciones'];
  dataSource = [ { rfc: 'ABC123', nombreCompleto: 'Juan Pérez', qnaProceso: '202601', acciones: 'Ver'} ];

  constructor(private fb: FormBuilder ) {}


  ngOnInit() {
    this.form = this.fb.group({ 
      anio: [''],
      quincena: [''],
      concepto: [''],
    });
    this.detailForm = this.fb.group({
      rfc: [''],
      nombreCompleto: [''],
      qnaProceso: ['']
    });
  }

  selectRow(row: any) {
    this.selectedRow = row;
    this.detailForm.patchValue(row);
  }

  onQnaModelChange(): void {
    if (!this.showRecords || !this.filtersReady) return;
    clearTimeout(this.qnaDebounceId);
    this.qnaDebounceId = setTimeout(() => {
      const key = `${this.anioSeleccionado}-${this.quincenaSeleccionada}`;
      if (this.lastQnaKey !== key && !this.isRefreshing) {
        this.lastQnaKey = key;
      }
    }, 0);
  }


}
