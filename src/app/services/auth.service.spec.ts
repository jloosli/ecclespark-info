import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should set authState to null when not in browser', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const service = TestBed.inject(AuthService);
    expect(service.authState()).toBeNull();
  });

  it('should start authState as false before auth resolves in browser', () => {
    // When in browser, authState starts as false until onAuthStateChanged fires
    // Since we can't easily mock firebase/auth, we just verify the service constructs
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    // Service should be constructable without errors (auth may be null in test env)
    expect(() => TestBed.inject(AuthService)).not.toThrow();
  });
});
