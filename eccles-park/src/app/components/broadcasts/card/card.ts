import { Component, computed, input } from '@angular/core';
import { Stream } from '../../../models/stream';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  stream = input.required<Stream>();

  formattedDate = computed(() => {
    const ts = this.stream().scheduled_at;
    if (!ts) return '';
    const date = ts.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  });

  youtubeUrl = computed(() => {
    const id = this.stream().youtube_id ?? this.stream().stream_id;
    return id ? `https://youtube.com/live/${id}` : null;
  });

  statusClasses = computed(() => {
    switch (this.stream().status) {
      case 'LIVE':
        return 'bg-red-500 text-white animate-pulse';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'ENDED':
        return 'bg-gray-100 text-gray-600';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 line-through';
    }
  });
}
