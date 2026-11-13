import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaBeneficiarioJmDialog } from './alta-beneficiario-jm-dialog';

describe('AltaBeneficiarioJmDialog', () => {
  let component: AltaBeneficiarioJmDialog;
  let fixture: ComponentFixture<AltaBeneficiarioJmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaBeneficiarioJmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaBeneficiarioJmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
