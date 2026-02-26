import { Component } from '@angular/core';

@Component({
  selector: 'app-no-results',
  imports: [],
  template: `<h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
    No upcoming broadcasts are scheduled
  </h2>`,
  styles: '',
})
export class NoResults {}
