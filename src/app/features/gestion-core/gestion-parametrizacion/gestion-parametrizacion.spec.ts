import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionParametrizacion } from './gestion-parametrizacion';

describe('GestionParametrizacion', () => {
  let component: GestionParametrizacion;
  let fixture: ComponentFixture<GestionParametrizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionParametrizacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionParametrizacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
