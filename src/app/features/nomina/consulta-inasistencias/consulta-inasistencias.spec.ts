import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaInasistencias } from './consulta-inasistencias';

describe('ConsultaInasistencias', () => {
  let component: ConsultaInasistencias;
  let fixture: ComponentFixture<ConsultaInasistencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaInasistencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaInasistencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
