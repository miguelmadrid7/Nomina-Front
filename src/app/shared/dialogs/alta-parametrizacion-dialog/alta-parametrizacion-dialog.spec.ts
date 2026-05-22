import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaParametrizacionDialog } from './alta-parametrizacion-dialog';

describe('AltaParametrizacionDialog', () => {
  let component: AltaParametrizacionDialog;
  let fixture: ComponentFixture<AltaParametrizacionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaParametrizacionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaParametrizacionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
