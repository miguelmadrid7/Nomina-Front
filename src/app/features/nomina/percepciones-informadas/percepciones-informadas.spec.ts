import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PercepcionesInformadas } from './percepciones-informadas';

describe('PercepcionesInformadas', () => {
  let component: PercepcionesInformadas;
  let fixture: ComponentFixture<PercepcionesInformadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PercepcionesInformadas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PercepcionesInformadas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
