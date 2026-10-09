import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuiciosMercantiles } from './juicios-mercantiles';

describe('JuiciosMercantiles', () => {
  let component: JuiciosMercantiles;
  let fixture: ComponentFixture<JuiciosMercantiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuiciosMercantiles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JuiciosMercantiles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
