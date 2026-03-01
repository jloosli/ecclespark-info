import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Broadcasts } from './broadcasts';

describe('Broadcasts', () => {
  let component: Broadcasts;
  let fixture: ComponentFixture<Broadcasts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Broadcasts],
    }).compileComponents();

    fixture = TestBed.createComponent(Broadcasts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the loading component when the app component is first created', () => {
    const fixture = TestBed.createComponent(Broadcasts);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-loading')).toBeTruthy();
  });

  it('should not show the no results component when the app component is first created', () => {
    const fixture = TestBed.createComponent(Broadcasts);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-no-results')).toBeFalsy();
  });

  it('should not show the results component when the app component is first created', () => {
    const fixture = TestBed.createComponent(Broadcasts);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-results')).toBeFalsy();
  });
});
