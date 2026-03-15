import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { StreamsService } from '../../../services/streams.service';
import { FunctionsService } from '../../../services/functions.service';
import { Stream } from '../../../models/stream';

@Component({
  selector: 'app-broadcast-list',
  imports: [DatePipe],
  templateUrl: './broadcast-list.html',
})
export class BroadcastList {
  private streamsService = inject(StreamsService);
  private functionsService = inject(FunctionsService);

  streams = toSignal<Stream[] | null>(this.streamsService.getActiveStreams(), {
    initialValue: null,
  });

  confirmingId = signal<string | null>(null);
  deletingId = signal<string | null>(null);
  deleteError = signal<{ id: string; message: string } | null>(null);

  requestDelete(stream: Stream) {
    this.deleteError.set(null);
    this.confirmingId.set(stream.id!);
  }

  cancelDelete() {
    this.confirmingId.set(null);
    this.deleteError.set(null);
  }

  async confirmDelete(stream: Stream) {
    this.confirmingId.set(null);
    this.deletingId.set(stream.id!);
    this.deleteError.set(null);

    try {
      await this.functionsService.deleteBroadcast({ firestoreId: stream.id! });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete broadcast.';
      this.deleteError.set({ id: stream.id!, message });
    } finally {
      this.deletingId.set(null);
    }
  }
}
