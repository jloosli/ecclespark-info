import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { StreamsService } from '../../../services/streams.service';
import { Stream } from '../../../models/stream';

@Component({
  selector: 'app-broadcast-list',
  imports: [DatePipe],
  templateUrl: './broadcast-list.html',
})
export class BroadcastList {
  private streamsService = inject(StreamsService);
  streams = toSignal<Stream[] | null>(this.streamsService.getActiveStreams(), {
    initialValue: null,
  });
}
