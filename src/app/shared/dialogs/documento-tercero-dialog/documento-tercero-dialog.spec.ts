import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentoTerceroDialog } from './documento-tercero-dialog';

describe('DocumentoTerceroDialog', () => {
  let component: DocumentoTerceroDialog;
  let fixture: ComponentFixture<DocumentoTerceroDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentoTerceroDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentoTerceroDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
