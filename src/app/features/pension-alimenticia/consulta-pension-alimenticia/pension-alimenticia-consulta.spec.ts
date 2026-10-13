import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PensionAlimenticiaConsulta } from './pension-alimenticia-consulta';

describe('PensionAlimenticiaConsulta', () => {
  let component: PensionAlimenticiaConsulta;
  let fixture: ComponentFixture<PensionAlimenticiaConsulta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PensionAlimenticiaConsulta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PensionAlimenticiaConsulta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
