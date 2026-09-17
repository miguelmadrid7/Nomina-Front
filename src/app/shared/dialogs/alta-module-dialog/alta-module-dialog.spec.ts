import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaModuleDialog } from './alta-module-dialog';

describe('AltaModuleDialog', () => {
  let component: AltaModuleDialog;
  let fixture: ComponentFixture<AltaModuleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaModuleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaModuleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
