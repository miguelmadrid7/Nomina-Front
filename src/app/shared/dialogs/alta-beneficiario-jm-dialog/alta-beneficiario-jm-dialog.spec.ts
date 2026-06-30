import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeneficiarioJmDialog } from './beneficiario-jm-dialog';

describe('BeneficiarioJmDialog', () => {
  let component: BeneficiarioJmDialog;
  let fixture: ComponentFixture<BeneficiarioJmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeneficiarioJmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeneficiarioJmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
