import { Routes } from '@angular/router';

<<<<<<< HEAD
export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/broadcasts/broadcasts').then(m => m.Broadcasts) },
  { path: 'setup', loadComponent: () => import('./components/setup/setup').then(m => m.Setup) },
  { path: '**', redirectTo: '' },
];
=======
export const routes: Routes = [];
>>>>>>> 53a1ded (Added Angular module)
