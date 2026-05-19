import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PensionAlimenticia } from './pension-alimenticia';

describe('PensionAlimenticia', () => {
  let component: PensionAlimenticia;
  let fixture: ComponentFixture<PensionAlimenticia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PensionAlimenticia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PensionAlimenticia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
