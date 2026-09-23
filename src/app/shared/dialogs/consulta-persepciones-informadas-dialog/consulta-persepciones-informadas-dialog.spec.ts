import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaPersepcionesInformadasDialog } from './consulta-persepciones-informadas-dialog';

describe('ConsultaPersepcionesInformadasDialog', () => {
  let component: ConsultaPersepcionesInformadasDialog;
  let fixture: ComponentFixture<ConsultaPersepcionesInformadasDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaPersepcionesInformadasDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaPersepcionesInformadasDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
