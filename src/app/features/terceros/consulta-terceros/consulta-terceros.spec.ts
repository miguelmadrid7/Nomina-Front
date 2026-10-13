import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaTerceros } from './consulta-terceros';

describe('ConsultaTerceros', () => {
  let component: ConsultaTerceros;
  let fixture: ComponentFixture<ConsultaTerceros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaTerceros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaTerceros);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
