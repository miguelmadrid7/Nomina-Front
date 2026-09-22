import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TercerosHistoricoDialog } from './terceros-historico-dialog';

describe('TercerosHistoricoDialog', () => {
  let component: TercerosHistoricoDialog;
  let fixture: ComponentFixture<TercerosHistoricoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TercerosHistoricoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TercerosHistoricoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
