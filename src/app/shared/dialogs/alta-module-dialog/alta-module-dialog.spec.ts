import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ALtaModuleDialog } from './alta-module-dialog';

describe('AltaModuleDialog', () => {
  let component: ALtaModuleDialog;
  let fixture: ComponentFixture<ALtaModuleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ALtaModuleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ALtaModuleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
