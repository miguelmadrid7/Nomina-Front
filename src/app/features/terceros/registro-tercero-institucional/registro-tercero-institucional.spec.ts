import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroTerceroInstitucional } from './registro-tercero-institucional';

describe('RegistroTerceroInstitucional', () => {
  let component: RegistroTerceroInstitucional;
  let fixture: ComponentFixture<RegistroTerceroInstitucional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroTerceroInstitucional]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistroTerceroInstitucional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
