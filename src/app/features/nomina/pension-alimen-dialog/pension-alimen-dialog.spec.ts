import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PensionAlimenDialog } from './pension-alimen-dialog';

describe('PensionAlimenDialog', () => {
  let component: PensionAlimenDialog;
  let fixture: ComponentFixture<PensionAlimenDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PensionAlimenDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PensionAlimenDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
