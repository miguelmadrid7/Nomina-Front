import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InasistenciasIncidencias } from './inasistencias-incidencias';

describe('InasistenciasIncidencias', () => {
  let component: InasistenciasIncidencias;
  let fixture: ComponentFixture<InasistenciasIncidencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InasistenciasIncidencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InasistenciasIncidencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
