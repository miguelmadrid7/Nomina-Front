import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroTercerosNoInstitucional } from './registro-terceros-no-institucional';

describe('RegistroTercerosNoInstitucional', () => {
  let component: RegistroTercerosNoInstitucional;
  let fixture: ComponentFixture<RegistroTercerosNoInstitucional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroTercerosNoInstitucional]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroTercerosNoInstitucional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
