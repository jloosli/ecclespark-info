import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Broadcasts } from './components/broadcasts/broadcasts';

@Component({
  selector: 'app-root',
  imports: [Header, Broadcasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('eccles-park');
}
