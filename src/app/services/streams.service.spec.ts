import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { StreamsService } from './streams.service';

describe('StreamsService', () => {
  it('should be injectable on server platform', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(StreamsService);
    expect(service).toBeTruthy();
  });

  it('should return EMPTY on server platform (completes immediately with no emission)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(StreamsService);
    let emitted = false;
    let completed = false;
    service.getActiveStreams().subscribe({
      next: () => (emitted = true),
      complete: () => (completed = true),
    });
    expect(emitted).toBe(false);
    expect(completed).toBe(true);
  });
});
