import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
<<<<<<< HEAD
  { path: 'setup', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
=======
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
>>>>>>> 53a1ded (Added Angular module)
];
