import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForbiddenDialog } from './forbidden-dialog';

describe('ForbiddenDialog', () => {
  let component: ForbiddenDialog;
  let fixture: ComponentFixture<ForbiddenDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForbiddenDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
