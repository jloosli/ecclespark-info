import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoResults } from './no-results';

describe('NoResults', () => {
  let component: NoResults;
  let fixture: ComponentFixture<NoResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoResults],
    }).compileComponents();

    fixture = TestBed.createComponent(NoResults);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the no broadcasts message', () => {
    const el = fixture.nativeElement as HTMLElement;
    const h2 = el.querySelector('h2');
    expect(h2?.textContent).toContain('No upcoming broadcasts are scheduled');
  });

});
