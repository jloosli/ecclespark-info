import { Component } from '@angular/core';
import { Announcements } from '../announcements/announcements';
import { Broadcasts } from '../broadcasts/broadcasts';

@Component({
  selector: 'app-home',
  imports: [Announcements, Broadcasts],
  template: `
    <main class="max-w-4xl mx-auto px-4 py-6">
      <app-announcements />
      <app-broadcasts />
    </main>
  `,
})
export class Home {}
