import { Component, inject, signal } from '@angular/core';
import { BroadcastForm } from './broadcast-form/broadcast-form';
import { BroadcastList } from './broadcast-list/broadcast-list';
import { SuccessBanner } from './success-banner/success-banner';
import { AuthService } from '../../services/auth.service';
import { YoutubeService, CreateBroadcastParams, BroadcastResult } from '../../services/youtube.service';
import { StreamsService } from '../../services/streams.service';
import { environment } from '../../../environments/environment';

type PageState = 'unauthenticated' | 'signing-in' | 'verifying' | 'unauthorized' | 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-setup',
  imports: [BroadcastForm, BroadcastList, SuccessBanner],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class Setup {
  private authService = inject(AuthService);
  private youtubeService = inject(YoutubeService);
  private streamsService = inject(StreamsService);

  pageState = signal<PageState>('unauthenticated');
  errorMessage = signal<string | null>(null);
  successResult = signal<BroadcastResult | null>(null);
  private accessToken: string | null = null;

  async signIn(): Promise<void> {
    this.pageState.set('signing-in');
    this.errorMessage.set(null);
    try {
      const { accessToken } = await this.authService.signInWithGoogle();
      this.accessToken = accessToken;
      this.pageState.set('verifying');

      const channelId = environment.youtube.channelId;
      const hasAccess = await new Promise<boolean>((resolve, reject) => {
        this.youtubeService.verifyChannelAccess(accessToken, channelId).subscribe({
          next: resolve,
          error: reject,
        });
      });

      this.pageState.set(hasAccess ? 'idle' : 'unauthorized');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'An unexpected error occurred');
      this.pageState.set('error');
    }
  }

  async onFormSubmit(params: CreateBroadcastParams): Promise<void> {
    if (!this.accessToken) {
      this.pageState.set('unauthenticated');
      return;
    }
    this.pageState.set('submitting');
    this.errorMessage.set(null);
    try {
      const result = await new Promise<BroadcastResult>((resolve, reject) => {
        this.youtubeService.createBroadcast(params, this.accessToken!).subscribe({
          next: resolve,
          error: reject,
        });
      });
      await this.streamsService.createStream({
        title: params.title,
        youtubeId: result.youtubeId,
        scheduledAt: result.scheduledStartTime,
      });
      this.successResult.set(result);
      this.pageState.set('success');
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'An unexpected error occurred');
      this.pageState.set('error');
    }
  }

  onDismissSuccess(): void {
    this.pageState.set('idle');
    this.successResult.set(null);
  }

  onRetry(): void {
    this.accessToken = null;
    this.errorMessage.set(null);
    this.pageState.set('unauthenticated');
  }
}
