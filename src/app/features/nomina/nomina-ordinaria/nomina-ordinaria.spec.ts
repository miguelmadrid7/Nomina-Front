import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominaOrdinaria } from './nomina-ordinaria';

describe('NominaOrdinaria', () => {
  let component: NominaOrdinaria;
  let fixture: ComponentFixture<NominaOrdinaria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominaOrdinaria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominaOrdinaria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
