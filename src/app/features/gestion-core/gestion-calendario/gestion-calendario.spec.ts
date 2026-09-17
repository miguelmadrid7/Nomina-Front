import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCalendario } from './gestion-calendario';

describe('GestionCalendario', () => {
  let component: GestionCalendario;
  let fixture: ComponentFixture<GestionCalendario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCalendario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCalendario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
