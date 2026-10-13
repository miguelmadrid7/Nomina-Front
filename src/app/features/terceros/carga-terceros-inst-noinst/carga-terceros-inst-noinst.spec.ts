import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaTercerosInstNoinst } from './carga-terceros-inst-noinst';

describe('CargaTercerosInstNoinst', () => {
  let component: CargaTercerosInstNoinst;
  let fixture: ComponentFixture<CargaTercerosInstNoinst>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaTercerosInstNoinst]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CargaTercerosInstNoinst);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
