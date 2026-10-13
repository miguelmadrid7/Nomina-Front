import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaTercerosNoInstitucionalesDialog } from './alta-terceros-no-institucionales-dialog';

describe('AltaTercerosNoInstitucionalesDialog', () => {
  let component: AltaTercerosNoInstitucionalesDialog;
  let fixture: ComponentFixture<AltaTercerosNoInstitucionalesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaTercerosNoInstitucionalesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaTercerosNoInstitucionalesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
