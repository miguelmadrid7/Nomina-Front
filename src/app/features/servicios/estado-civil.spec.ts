import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EstadoCivilService } from './estado-civil';

describe('EstadoCivilService', () => {
  let service: EstadoCivilService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EstadoCivilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});