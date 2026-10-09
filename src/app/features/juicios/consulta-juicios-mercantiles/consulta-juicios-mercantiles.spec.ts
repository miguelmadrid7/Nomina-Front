import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaJuiciosMercantiles } from './consulta-juicios-mercantiles';

describe('ConsultaJuiciosMercantiles', () => {
  let component: ConsultaJuiciosMercantiles;
  let fixture: ComponentFixture<ConsultaJuiciosMercantiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaJuiciosMercantiles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaJuiciosMercantiles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
