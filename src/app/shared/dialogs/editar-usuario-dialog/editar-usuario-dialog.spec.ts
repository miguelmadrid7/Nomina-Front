import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuarioDialog } from './editar-usuario-dialog';

describe('UsuarioDialog', () => {
  let component: UsuarioDialog;
  let fixture: ComponentFixture<UsuarioDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuarioDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
