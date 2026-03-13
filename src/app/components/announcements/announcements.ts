import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnnouncementsService } from '../../services/announcements.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-announcements',
  imports: [MarkdownPipe],
  templateUrl: './announcements.html',
})
export class Announcements {
  private announcementsService = inject(AnnouncementsService);

  announcements = toSignal(this.announcementsService.getActiveAnnouncements(), {
    initialValue: [],
  });
}
