import { TestBed } from '@angular/core/testing';
<<<<<<< HEAD
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
=======
import { App } from './app';
>>>>>>> 53a1ded (Added Angular module)

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
<<<<<<< HEAD
      providers: [provideRouter(routes)],
=======
>>>>>>> 53a1ded (Added Angular module)
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

<<<<<<< HEAD
  it('should render the header component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should render the broadcasts component', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-broadcasts')).toBeTruthy();
=======
  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, eccles-park');
>>>>>>> 53a1ded (Added Angular module)
  });
});
