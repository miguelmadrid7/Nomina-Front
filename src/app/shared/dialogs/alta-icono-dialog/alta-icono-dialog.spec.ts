import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconoDialog } from './icono-dialog';

describe('IconoDialog', () => {
  let component: IconoDialog;
  let fixture: ComponentFixture<IconoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
