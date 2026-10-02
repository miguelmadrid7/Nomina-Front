import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominaordConceptoDialog } from './nominaord-concepto-dialog';

describe('NominaordConceptoDialog', () => {
  let component: NominaordConceptoDialog;
  let fixture: ComponentFixture<NominaordConceptoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominaordConceptoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominaordConceptoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
