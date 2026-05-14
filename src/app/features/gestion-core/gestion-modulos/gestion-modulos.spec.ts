import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionModulos } from './gestion-modulos';

describe('GestionModulos', () => {
  let component: GestionModulos;
  let fixture: ComponentFixture<GestionModulos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionModulos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionModulos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
