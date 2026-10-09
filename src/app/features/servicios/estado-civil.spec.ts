import { TestBed } from '@angular/core/testing';

import { EstadoCivil } from './estado-civil';

describe('EstadoCivil', () => {
  let service: EstadoCivil;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadoCivil);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
