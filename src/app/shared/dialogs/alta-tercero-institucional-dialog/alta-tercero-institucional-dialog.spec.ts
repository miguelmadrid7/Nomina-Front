import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaTerceroInstitucionalDialog } from './alta-tercero-institucional-dialog';

describe('DialogTercero5L', () => {
  let component: AltaTerceroInstitucionalDialog;
  let fixture: ComponentFixture<AltaTerceroInstitucionalDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaTerceroInstitucionalDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaTerceroInstitucionalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
