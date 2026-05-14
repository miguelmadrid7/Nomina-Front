import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleDialog } from './module-dialog';

describe('ModuleDialog', () => {
  let component: ModuleDialog;
  let fixture: ComponentFixture<ModuleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
