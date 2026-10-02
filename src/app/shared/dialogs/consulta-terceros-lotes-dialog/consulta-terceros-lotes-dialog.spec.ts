import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaTercerosLotesDialog } from './consulta-terceros-lotes-dialog';

describe('ConsultaTercerosLotesDialog', () => {
  let component: ConsultaTercerosLotesDialog;
  let fixture: ComponentFixture<ConsultaTercerosLotesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaTercerosLotesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaTercerosLotesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
