import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaPensionesDialog } from './consulta-pensiones-dialog';

describe('ConsultaPensionesDialog', () => {
  let component: ConsultaPensionesDialog;
  let fixture: ComponentFixture<ConsultaPensionesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaPensionesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaPensionesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
