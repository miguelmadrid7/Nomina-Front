import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionRole } from './gestion-role';

describe('GestionRoleUsuarios', () => {
  let component: GestionRole;
  let fixture: ComponentFixture<GestionRole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionRole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
