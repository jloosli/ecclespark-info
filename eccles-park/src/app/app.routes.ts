import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/broadcasts/broadcasts').then(m => m.Broadcasts) },
  { path: 'setup', loadComponent: () => import('./components/setup/setup').then(m => m.Setup) },
  { path: '**', redirectTo: '' },
];
