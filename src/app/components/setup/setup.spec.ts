import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Setup } from './setup';
import { AuthService } from '../../services/auth.service';
import { YoutubeService } from '../../services/youtube.service';
import { StreamsService } from '../../services/streams.service';

describe('Setup', () => {
  const mockAuthService = {
    authState: signal(null),
    signInWithGoogle: async () => ({ credential: {} as never, accessToken: 'test-token' }),
  };

  const mockYoutubeService = {
    verifyChannelAccess: () => of(true),
    createBroadcast: () => ({
      subscribe: ({ next }: { next: (r: unknown) => void }) =>
        next({
          youtubeId: 'abc123',
          scheduledStartTime: new Date(),
          publishedAt: new Date(),
          watchUrl: 'https://www.youtube.com/watch?v=abc123',
        }),
    }),
  };

  const mockStreamsService = {
    getActiveStreams: () => of([]),
    createStream: async () => 'doc-id',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({}).overrideProvider(AuthService, {
      useValue: mockAuthService,
    }).overrideProvider(YoutubeService, {
      useValue: mockYoutubeService,
    }).overrideProvider(StreamsService, {
      useValue: mockStreamsService,
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Setup);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start in unauthenticated state', () => {
    const fixture = TestBed.createComponent(Setup);
    expect(fixture.componentInstance.pageState()).toBe('unauthenticated');
  });

  it('should transition to idle after successful sign-in and verification', async () => {
    const fixture = TestBed.createComponent(Setup);
    await fixture.componentInstance.signIn();
    expect(fixture.componentInstance.pageState()).toBe('idle');
  });

  it('should transition to unauthorized when channel access is denied', async () => {
    TestBed.overrideProvider(YoutubeService, {
      useValue: { ...mockYoutubeService, verifyChannelAccess: () => of(false) },
    });
    const fixture = TestBed.createComponent(Setup);
    await fixture.componentInstance.signIn();
    expect(fixture.componentInstance.pageState()).toBe('unauthorized');
  });
});
