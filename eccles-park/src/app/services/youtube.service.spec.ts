import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { YoutubeService } from './youtube.service';

describe('YoutubeService', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const service = TestBed.inject(YoutubeService);
    expect(service).toBeTruthy();
  });

  it('should resolve loadScripts immediately on server', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const service = TestBed.inject(YoutubeService);
    // On server, loadScripts resolves immediately
    await expect(
      (service as unknown as { loadScripts: () => Promise<void> }).loadScripts(),
    ).resolves.toBeUndefined();
  });

  it('should throw error when createBroadcast is called on server', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const service = TestBed.inject(YoutubeService);

    expect(() => {
      service.createBroadcast(
        { title: 'Test', scheduledStartTime: new Date() },
        'fake-token'
      );
    }).toThrow('createBroadcast can only be called in browser context');
  });
});
