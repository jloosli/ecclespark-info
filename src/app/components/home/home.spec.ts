import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Home } from './home';
import { AnnouncementsService } from '../../services/announcements.service';
import { StreamsService } from '../../services/streams.service';

describe('Home', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({})
      .overrideProvider(AnnouncementsService, {
        useValue: { getActiveAnnouncements: () => of([]) },
      })
      .overrideProvider(StreamsService, {
        useValue: { getActiveStreams: () => of([]) },
      });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render both announcements and broadcasts components', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-announcements')).toBeTruthy();
    expect(el.querySelector('app-broadcasts')).toBeTruthy();
  });
});
