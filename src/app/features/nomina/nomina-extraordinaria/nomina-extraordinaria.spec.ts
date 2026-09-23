import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NominaExtraordinaria } from './nomina-extraordinaria';

describe('NominaExtraordinaria', () => {
  let component: NominaExtraordinaria;
  let fixture: ComponentFixture<NominaExtraordinaria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NominaExtraordinaria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NominaExtraordinaria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
