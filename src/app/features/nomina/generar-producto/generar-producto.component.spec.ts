import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarProductoComponent } from './generar-producto.component';

describe('GenerarProductoComponent', () => {
  let component: GenerarProductoComponent;
  let fixture: ComponentFixture<GenerarProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerarProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerarProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
