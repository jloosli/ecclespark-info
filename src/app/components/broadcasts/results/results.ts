import { Component, input } from '@angular/core';
import { Card } from '../card/card';
import { Stream } from '../../../models/stream';

@Component({
  selector: 'app-results',
  imports: [Card],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {
  streams = input.required<Stream[]>();
}
