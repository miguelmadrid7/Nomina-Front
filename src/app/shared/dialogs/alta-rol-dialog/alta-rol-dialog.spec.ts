import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaRolDialog } from './alta-rol-dialog';

describe('AltaRolDialog', () => {
  let component: AltaRolDialog;
  let fixture: ComponentFixture<AltaRolDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaRolDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaRolDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
