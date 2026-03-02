import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NoResults } from './no-results/no-results';
import { Results } from './results/results';
import { Loading } from './loading/loading';
import { StreamsService } from '../../services/streams.service';
import { Stream } from '../../models/stream';

@Component({
  selector: 'app-broadcasts',
  imports: [Loading, Results, NoResults],
  templateUrl: './broadcasts.html',
  styleUrl: './broadcasts.css',
})
export class Broadcasts {
  private streamsService = inject(StreamsService);

  streams = toSignal<Stream[] | null>(this.streamsService.getActiveStreams(), {
    initialValue: null,
  });

  dataState = computed(() => {
    const s = this.streams();
    if (s === null) return 'loading';
    return s.length === 0 ? 'no-results' : 'results';
  });
}
