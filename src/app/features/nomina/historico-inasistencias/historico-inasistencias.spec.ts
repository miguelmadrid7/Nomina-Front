import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricoInasistencias } from './historico-inasistencias';

describe('HistoricoInasistencias', () => {
  let component: HistoricoInasistencias;
  let fixture: ComponentFixture<HistoricoInasistencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricoInasistencias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricoInasistencias);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
