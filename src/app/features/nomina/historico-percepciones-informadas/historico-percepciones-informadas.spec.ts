import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricoPercepcionesInformadas } from './historico-percepciones-informadas';

describe('HistoricoPercepcionesInformadas', () => {
  let component: HistoricoPercepcionesInformadas;
  let fixture: ComponentFixture<HistoricoPercepcionesInformadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricoPercepcionesInformadas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricoPercepcionesInformadas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
