import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricoTerceros } from './historico-terceros';

describe('HistoricoTerceros', () => {
  let component: HistoricoTerceros;
  let fixture: ComponentFixture<HistoricoTerceros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricoTerceros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricoTerceros);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
