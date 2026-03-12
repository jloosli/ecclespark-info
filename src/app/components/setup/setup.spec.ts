import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Setup } from './setup';
import { AuthService } from '../../services/auth.service';
import { FunctionsService } from '../../services/functions.service';
import { StreamsService } from '../../services/streams.service';

describe('Setup', () => {
  const mockAuthService = {
    authState: signal(null),
    signInWithGoogle: async () => {},
  };

  const mockFunctionsService = {
    createBroadcast: async () => ({
      youtubeId: 'abc123',
      scheduledStartTime: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      watchUrl: 'https://www.youtube.com/watch?v=abc123',
      firestoreId: 'doc-id',
    }),
  };

  const mockStreamsService = {
    getActiveStreams: () => of([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({})
      .overrideProvider(AuthService, { useValue: mockAuthService })
      .overrideProvider(FunctionsService, { useValue: mockFunctionsService })
      .overrideProvider(StreamsService, { useValue: mockStreamsService });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Setup);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in unauthenticated state', () => {
    const fixture = TestBed.createComponent(Setup);
    expect(fixture.componentInstance.pageState()).toBe('unauthenticated');
  });

  it('should transition to idle after successful sign-in', async () => {
    const fixture = TestBed.createComponent(Setup);
    await fixture.componentInstance.signIn();
    expect(fixture.componentInstance.pageState()).toBe('idle');
  });

  it('should show permission-denied error for unauthorized users', async () => {
    TestBed.overrideProvider(FunctionsService, {
      useValue: {
        createBroadcast: async () => {
          throw { code: 'functions/permission-denied', message: 'Not authorized' };
        },
      },
    });
    const fixture = TestBed.createComponent(Setup);
    await fixture.componentInstance.signIn();
    await fixture.componentInstance.onFormSubmit({
      title: 'Test',
      scheduledStartTime: new Date(),
    });
    expect(fixture.componentInstance.pageState()).toBe('error');
    expect(fixture.componentInstance.errorMessage()).toBe(
      'Your account is not authorized to create broadcasts.',
    );
  });
});
