import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  connectFunctionsEmulator,
  Functions,
  getFunctions,
  httpsCallable,
} from 'firebase/functions';
import { app } from '../firebase';
import { environment } from '../../environments/environment';

export interface CreateBroadcastRequest {
  title: string;
  /** ISO 8601 date-time string. */
  scheduledStartTime: string;
}

export interface CreateBroadcastResponse {
  youtubeId: string;
  scheduledStartTime: string;
  publishedAt: string;
  watchUrl: string;
  firestoreId: string;
}

@Injectable({ providedIn: 'root' })
export class FunctionsService {
  private platformId = inject(PLATFORM_ID);
  private functions: Functions | null = null;

  private getFunctionsInstance(): Functions {
    if (this.functions) return this.functions;
    if (!app) throw new Error('Firebase not initialized');
    this.functions = getFunctions(app, 'us-central1');
    if (!environment.production) {
      connectFunctionsEmulator(this.functions, 'localhost', 5001);
    }
    return this.functions;
  }

  async createBroadcast(
    params: CreateBroadcastRequest,
  ): Promise<CreateBroadcastResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Cannot call Cloud Functions on the server');
    }
    const functions = this.getFunctionsInstance();
    const callable = httpsCallable<
      CreateBroadcastRequest,
      CreateBroadcastResponse
    >(functions, 'createBroadcast');
    const result = await callable(params);
    return result.data;
  }
}
