import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { from, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateBroadcastParams {
  title: string;
  scheduledStartTime: Date;
}

export interface BroadcastResult {
  youtubeId: string;
  scheduledStartTime: Date;
  publishedAt: Date;
  watchUrl: string;
}

// Minimal gapi type declaration for what we use
declare const gapi: {
  load: (lib: string, callback: () => void) => void;
  client: {
    init: (config: object) => Promise<void>;
    setToken: (token: { access_token: string }) => void;
    request: (args: {
      path: string;
      method: string;
      params?: Record<string, string>;
      body?: unknown;
    }) => Promise<{ body: string; status: number }>;
  };
};

@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private platformId = inject(PLATFORM_ID);
  private scriptsLoaded = false;

  private loadScripts(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    if (this.scriptsLoaded) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Google API scripts failed to load within 10 seconds')),
        10000,
      );

      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Google API script'));
      };
      gapiScript.onload = () => {
        gapi.load('client', () => {
          gapi.client
            .init({})
            .then(() => {
              clearTimeout(timeout);
              this.scriptsLoaded = true;
              resolve();
            })
            .catch((err: unknown) => {
              clearTimeout(timeout);
              reject(err instanceof Error ? err : new Error(String(err)));
            });
        });
      };
      document.head.appendChild(gapiScript);
    });
  }

  createBroadcast(params: CreateBroadcastParams, accessToken: string): Observable<BroadcastResult> {
    return from(this.loadScripts()).pipe(
      switchMap(() => from(this.doCreateBroadcast(params, accessToken))),
    );
  }

  private async doCreateBroadcast(
    params: CreateBroadcastParams,
    accessToken: string,
  ): Promise<BroadcastResult> {
    gapi.client.setToken({ access_token: accessToken });

    const broadcastResponse = await gapi.client.request({
      path: 'https://www.googleapis.com/youtube/v3/liveBroadcasts',
      method: 'POST',
      params: { part: 'snippet,status,contentDetails' },
      body: {
        snippet: {
          title: params.title,
          scheduledStartTime: params.scheduledStartTime.toISOString(),
        },
        status: {
          privacyStatus: 'unlisted',
        },
        contentDetails: {
          enableAutoStart: false,
          enableAutoStop: false,
        },
      },
    });

    if (broadcastResponse.status >= 400) {
      throw new Error(`YouTube API error: ${broadcastResponse.status}`);
    }

    const broadcast = JSON.parse(broadcastResponse.body) as {
      id: string;
      snippet: { scheduledStartTime: string; publishedAt: string };
    };
    const youtubeId = broadcast.id;

    if (environment.youtube.streamId) {
      const bindResponse = await gapi.client.request({
        path: 'https://www.googleapis.com/youtube/v3/liveBroadcasts/bind',
        method: 'POST',
        params: {
          id: youtubeId,
          part: 'id,contentDetails',
          streamId: environment.youtube.streamId,
        },
      });
      if (bindResponse.status >= 400) {
        throw new Error(`YouTube bind error: ${bindResponse.status}`);
      }
    }

    return {
      youtubeId,
      scheduledStartTime: new Date(broadcast.snippet.scheduledStartTime),
      publishedAt: new Date(broadcast.snippet.publishedAt),
      watchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }
}
