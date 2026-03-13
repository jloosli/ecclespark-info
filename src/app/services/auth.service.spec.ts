import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should set authState to null (not false/loading) on server platform', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const service = TestBed.inject(AuthService);
    expect(service.authState()).toBeNull();
    expect(service.authState()).not.toBe(false);
  });

  it('should construct safely in browser environment', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    expect(() => TestBed.inject(AuthService)).not.toThrow();
  });
});
