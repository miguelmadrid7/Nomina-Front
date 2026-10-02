import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltaCalendarioDialog } from './alta-calendario-dialog';

describe('AltaCalendarioDialog', () => {
  let component: AltaCalendarioDialog;
  let fixture: ComponentFixture<AltaCalendarioDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltaCalendarioDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltaCalendarioDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
