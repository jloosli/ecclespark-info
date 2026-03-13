import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { FunctionsService } from './functions.service';

describe('FunctionsService', () => {
  it('should be injectable', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(FunctionsService);
    expect(service).toBeTruthy();
  });

  it('should throw when createBroadcast is called on the server platform', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(FunctionsService);
    await expect(
      service.createBroadcast({ title: 'Test', scheduledStartTime: '2026-03-15T10:00:00Z' }),
    ).rejects.toThrow('Cannot call Cloud Functions on the server');
  });

});
