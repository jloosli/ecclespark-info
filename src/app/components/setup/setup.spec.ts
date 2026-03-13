import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Setup } from './setup';
import { AuthService } from '../../services/auth.service';
import { FunctionsService, CreateBroadcastResponse } from '../../services/functions.service';
import { StreamsService } from '../../services/streams.service';

describe('Setup', () => {
  const mockResult: CreateBroadcastResponse = {
    youtubeId: 'abc123',
    scheduledStartTime: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    watchUrl: 'https://www.youtube.com/watch?v=abc123',
    firestoreId: 'doc-id',
  };

  const mockAuthService = {
    authState: signal(null),
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
  };

  const mockFunctionsService = {
    createBroadcast: vi.fn().mockResolvedValue(mockResult),
  };

  const mockStreamsService = {
    getActiveStreams: () => of([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('success path', () => {
    it('should transition to success after form submit', async () => {
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.signIn();
      await fixture.componentInstance.onFormSubmit({
        title: 'Test',
        scheduledStartTime: new Date('2026-03-15T10:00:00'),
      });
      expect(fixture.componentInstance.pageState()).toBe('success');
      expect(fixture.componentInstance.successResult()).toEqual(mockResult);
      expect(fixture.componentInstance.errorMessage()).toBeNull();
    });

    it('should pass ISO string to createBroadcast', async () => {
      const fixture = TestBed.createComponent(Setup);
      const date = new Date('2026-03-15T10:00:00');
      await fixture.componentInstance.onFormSubmit({
        title: 'Test',
        scheduledStartTime: date,
      });
      expect(mockFunctionsService.createBroadcast).toHaveBeenCalledWith({
        title: 'Test',
        scheduledStartTime: date.toISOString(),
      });
    });
  });

  describe('dismiss success banner', () => {
    it('should reset to idle and clear successResult', async () => {
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.signIn();
      await fixture.componentInstance.onFormSubmit({
        title: 'Test',
        scheduledStartTime: new Date(),
      });
      expect(fixture.componentInstance.pageState()).toBe('success');

      fixture.componentInstance.onDismissSuccess();
      expect(fixture.componentInstance.pageState()).toBe('idle');
      expect(fixture.componentInstance.successResult()).toBeNull();
    });
  });

  describe('permission-denied error', () => {
    it('should show permission-denied error for unauthorized users', async () => {
      mockFunctionsService.createBroadcast.mockRejectedValueOnce({
        code: 'functions/permission-denied',
        message: 'Not authorized',
      });
      const fixture = TestBed.createComponent(Setup);
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

  describe('generic error handling', () => {
    it('should use error message for non-permission errors', async () => {
      mockFunctionsService.createBroadcast.mockRejectedValueOnce({
        code: 'functions/internal',
        message: 'Something went wrong',
      });
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.onFormSubmit({
        title: 'Test',
        scheduledStartTime: new Date(),
      });
      expect(fixture.componentInstance.pageState()).toBe('error');
      expect(fixture.componentInstance.errorMessage()).toBe('Something went wrong');
    });

    it('should use fallback message when error has no message', async () => {
      mockFunctionsService.createBroadcast.mockRejectedValueOnce({
        code: 'functions/unknown',
      });
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.onFormSubmit({
        title: 'Test',
        scheduledStartTime: new Date(),
      });
      expect(fixture.componentInstance.errorMessage()).toBe('An unexpected error occurred');
    });

    it('should handle sign-in Error objects', async () => {
      mockAuthService.signInWithGoogle.mockRejectedValueOnce(new Error('Popup closed'));
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.signIn();
      expect(fixture.componentInstance.pageState()).toBe('error');
      expect(fixture.componentInstance.errorMessage()).toBe('Popup closed');
    });

    it('should use fallback for non-Error sign-in failures', async () => {
      mockAuthService.signInWithGoogle.mockRejectedValueOnce('unknown');
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.signIn();
      expect(fixture.componentInstance.pageState()).toBe('error');
      expect(fixture.componentInstance.errorMessage()).toBe('Sign-in failed');
    });
  });

  describe('retry after error', () => {
    it('should reset to unauthenticated and clear error', async () => {
      mockAuthService.signInWithGoogle.mockRejectedValueOnce(new Error('fail'));
      const fixture = TestBed.createComponent(Setup);
      await fixture.componentInstance.signIn();
      expect(fixture.componentInstance.pageState()).toBe('error');

      fixture.componentInstance.onRetry();
      expect(fixture.componentInstance.pageState()).toBe('unauthenticated');
      expect(fixture.componentInstance.errorMessage()).toBeNull();
    });
  });
});
