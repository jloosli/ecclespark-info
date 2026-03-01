import { Component, input, output } from '@angular/core';
import { BroadcastResult } from '../../../services/youtube.service';

@Component({
  selector: 'app-success-banner',
  template: `
    <div role="alert" class="rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
      <div class="flex items-start justify-between">
        <div>
          <p class="font-medium text-green-800 dark:text-green-300">Broadcast scheduled!</p>
          <a
            [href]="result().watchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 block text-sm text-green-700 underline dark:text-green-400"
          >
            {{ result().watchUrl }}
          </a>
        </div>
        <button
          type="button"
          (click)="dismissed.emit()"
          aria-label="Dismiss success notification"
          class="ml-4 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
        >
          ✕
        </button>
      </div>
    </div>
  `,
})
export class SuccessBanner {
  result = input.required<BroadcastResult>();
  dismissed = output<void>();
}
