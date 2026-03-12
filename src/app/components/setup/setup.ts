import { Component, inject, signal } from '@angular/core';
import { BroadcastForm } from './broadcast-form/broadcast-form';
import { BroadcastList } from './broadcast-list/broadcast-list';
import { SuccessBanner } from './success-banner/success-banner';
import { AuthService } from '../../services/auth.service';
import {
  FunctionsService,
  CreateBroadcastResponse,
} from '../../services/functions.service';

type PageState =
  | 'unauthenticated'
  | 'signing-in'
  | 'idle'
  | 'submitting'
  | 'success'
  | 'error';

@Component({
  selector: 'app-setup',
  imports: [BroadcastForm, BroadcastList, SuccessBanner],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class Setup {
  private authService = inject(AuthService);
  private functionsService = inject(FunctionsService);

  pageState = signal<PageState>('unauthenticated');
  errorMessage = signal<string | null>(null);
  successResult = signal<CreateBroadcastResponse | null>(null);

  async signIn(): Promise<void> {
    this.pageState.set('signing-in');
    this.errorMessage.set(null);
    try {
      await this.authService.signInWithGoogle();
      this.pageState.set('idle');
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'Sign-in failed',
      );
      this.pageState.set('error');
    }
  }

  async onFormSubmit(params: {
    title: string;
    scheduledStartTime: Date;
  }): Promise<void> {
    this.pageState.set('submitting');
    this.errorMessage.set(null);
    try {
      const result = await this.functionsService.createBroadcast({
        title: params.title,
        scheduledStartTime: params.scheduledStartTime.toISOString(),
      });
      this.successResult.set(result);
      this.pageState.set('success');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'functions/permission-denied') {
        this.errorMessage.set(
          'Your account is not authorized to create broadcasts.',
        );
      } else {
        this.errorMessage.set(
          firebaseErr.message ?? 'An unexpected error occurred',
        );
      }
      this.pageState.set('error');
    }
  }

  onDismissSuccess(): void {
    this.pageState.set('idle');
    this.successResult.set(null);
  }

  onRetry(): void {
    this.errorMessage.set(null);
    this.pageState.set('unauthenticated');
  }
}
