import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditacionLogs } from './auditacion-logs';

describe('AuditacionLogs', () => {
  let component: AuditacionLogs;
  let fixture: ComponentFixture<AuditacionLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditacionLogs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditacionLogs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
