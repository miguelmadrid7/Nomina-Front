import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionRoleUsuarios } from './gestion-role-usuarios';

describe('GestionRoleUsuarios', () => {
  let component: GestionRoleUsuarios;
  let fixture: ComponentFixture<GestionRoleUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionRoleUsuarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionRoleUsuarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
