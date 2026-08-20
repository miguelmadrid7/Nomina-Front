import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { LogService } from '../../../core/services/log.service';
import { Observable } from 'rxjs';
import { LogFileResponse } from '../../../core/model/response/logfile-response.model';
import { LogDateResponse } from '../../../core/model/response/logdate-response.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-auditacion-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './auditacion-logs.html',
  styleUrl: './auditacion-logs.css'
})
export class AuditacionLogs {

  availableDates: string[] = [];
  selectedDate: string = '';
  selectedType: string = '';
  logLines: string[] = [];
  loading: boolean = false;
  searchText: string = '';
  tailLines: number = 100;

  private logService = inject(LogService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadAvailableDates();
  }

  loadAvailableDates(): void {
    this.loading = true;
    this.cdr.detectChanges(); 
    this.logService.getAvailableDates().subscribe({
      next: (response: LogDateResponse) => {
        this.availableDates = response.dates;
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.toastService.error('Operacion invalida', 'Error al cargar fechas disponibles', 6000);
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  loadLog(): void {
    if (!this.selectedDate) return;
    this.loading = true;
    this.logLines = [];
    this.cdr.detectChanges(); 

    const method = this.getMethodByType(this.selectedType);
      method(this.selectedDate).subscribe({
        next: (response: LogFileResponse) => {
          this.logLines = response.lines;
          this.loading = false;
          this.cdr.detectChanges(); 
        },
        error: () => {
          this.toastService.error('Operacion invalida', 'Error al cargar el log', 6000);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  tailLog(): void {
    if (!this.selectedDate) return;
    this.loading = true;
    this.logLines = [];
    this.cdr.detectChanges(); 
    this.logService.tailLog(this.selectedDate, this.selectedType, this.tailLines).subscribe({
      next: (response: LogFileResponse) => {
        this.logLines = response.lines;
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.toastService.error('Operacion invalida', 'Error al cargar las últimas líneas', 6000);
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  searchLog(): void {
    if (!this.selectedDate || !this.searchText) return;
    this.loading = true;
    this.logLines = [];
    this.cdr.detectChanges(); 
    
    console.log('Iniciando búsqueda:', this.selectedDate, this.selectedType, this.searchText);
    
    this.logService.searchLog(this.selectedDate, this.selectedType, this.searchText).subscribe({
      next: (response: LogFileResponse) => {
        console.log('Respuesta recibida:', response);
        this.logLines = response.lines || []; 
        this.loading = false;
        this.cdr.detectChanges(); 
        
        console.log('logLines después de asignar:', this.logLines);
        console.log('loading después de asignar:', this.loading);
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.toastService.error('Operacion invalida', 'Error al buscar en el log', 6000);
        this.loading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedType = '';
    this.selectedDate = '';
    this.logLines = [];
    this.loading = false;
    this.cdr.detectChanges();
  }

   private getMethodByType(type: string): (fecha: string) => Observable<LogFileResponse> {
    switch (type) {
      case 'error':
        return (fecha) => this.logService.getErrorLog(fecha);
      case 'login':
        return (fecha) => this.logService.getLoginLog(fecha);
      default:
        return (fecha) => this.logService.getApplicationLog(fecha);
    }
  }
}
