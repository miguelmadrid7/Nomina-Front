import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalculoNominaComponent } from './calculo-nomina.component';

describe('CalculoNominaComponent', () => {
  let component: CalculoNominaComponent;
  let fixture: ComponentFixture<CalculoNominaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculoNominaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalculoNominaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
