import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelectModule } from '@angular/material/select';
import { PensionAlimenticiaService } from '../../services/pension-alimenticia.service';

@Component({
  selector: 'app-pension-alimenticia',
  standalone: true,
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatInputModule,
    MatCardModule, 
    MatButtonModule,
    MatSelectModule,
    MatOption
  ],
  templateUrl: './pension-alimenticia.html',
  styleUrl: './pension-alimenticia.css'
})
export class PensionAlimenticia {

  rfc: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  nombreCompleto: string = '';

  empleadoId!: number;
  formaAplicacion: string = '';
  factorImporte!: number;
  numeroBeneficiario!: number;
  vigenciaInicio!: number;
  vigenciaFin!: number;
  numeroDocumento: string = '';

  bancos: any[] = [];
  bancoSeleccionado: any;

  constructor(private pensionAlimenticiaService:  PensionAlimenticiaService) {}

  ngOnInit(): void {
    this.cargarBancos();
  }

  cargarBancos(): void {
    this.pensionAlimenticiaService.getBancos()
    .subscribe({
      next: (response: any) => {
        this.bancos = response.data;
      },
      error: (err: any) => {
        console.error('Error al  cargar bancos', err)
      }
    })
  }

  guardar(): void {
  const beneficiarioAlimPayload = {
    rfc: this.rfc,
    primerApellido: this.apellidoPaterno,
    segundoApellido: this.apellidoMaterno,
    nombre: this.nombreCompleto
  };


  this.pensionAlimenticiaService.addBeneficiarioAlim(beneficiarioAlimPayload)
    .subscribe({
      next: (resp: any) => {

        const beneficiarioAlimId = resp?.data?.id;

        if (!beneficiarioAlimId) {
          console.error('No se recibió ID del beneficiario');
          return;
        }

        const beneficiarioPayload = {
          tabEmpleadosId: this.empleadoId, // debes tenerlo del buscador
          tabBeneficiariosAlimId: beneficiarioAlimId,
          formaAplicacion: this.formaAplicacion,
          factorImporte: this.factorImporte,
          numeroBenef: this.numeroBeneficiario,
          qnaini: this.vigenciaInicio,
          qnafin: this.vigenciaFin,
          numeroDocumento: this.numeroDocumento,
          bancoId: this.bancoSeleccionado // si aplica
        };

        this.pensionAlimenticiaService.addBeneficario(beneficiarioPayload)
          .subscribe({
            next: () => {
              console.log('Beneficiario guardado correctamente');
            },
            error: err => {
              console.error('Error al guardar pensión alimenticia', err);
            }
          });

      },
      error: err => {
        console.error('Error al crear beneficiario base', err);
      }
    });
}






}
