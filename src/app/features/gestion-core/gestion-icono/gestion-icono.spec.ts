import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionIcono } from './gestion-icono';

describe('GestionIcono', () => {
  let component: GestionIcono;
  let fixture: ComponentFixture<GestionIcono>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionIcono]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionIcono);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
