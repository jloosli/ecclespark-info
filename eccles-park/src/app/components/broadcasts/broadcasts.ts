import { Component } from '@angular/core';
import { NoResults } from './no-results/no-results';
import { Results } from './results/results';
import { Loading } from './loading/loading';

@Component({
  selector: 'app-broadcasts',
  imports: [Loading, Results, NoResults],
  templateUrl: './broadcasts.html',
  styleUrl: './broadcasts.css',
})
export class Broadcasts {}
