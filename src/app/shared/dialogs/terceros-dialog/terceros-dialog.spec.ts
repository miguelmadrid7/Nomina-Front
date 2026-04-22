import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TercerosDialog } from './terceros-dialog';

describe('TercerosDialog', () => {
  let component: TercerosDialog;
  let fixture: ComponentFixture<TercerosDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TercerosDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TercerosDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
