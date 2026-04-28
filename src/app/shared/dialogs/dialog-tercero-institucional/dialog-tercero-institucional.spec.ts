import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTerceroInstitucional } from './dialog-tercero-institucional';

describe('DialogTercero5L', () => {
  let component: DialogTerceroInstitucional;
  let fixture: ComponentFixture<DialogTerceroInstitucional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTerceroInstitucional]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogTerceroInstitucional);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
