import { TestBed } from '@angular/core/testing';
import { of, EMPTY } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

import { Announcements } from './announcements';
import { AnnouncementsService } from '../../services/announcements.service';
import { Announcement } from '../../models/announcement';

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    markdown_text: '**Important** announcement',
    active: true,
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
  },
  {
    id: '2',
    markdown_text: 'Second announcement with a [link](https://example.com)',
    active: true,
    created_at: Timestamp.fromDate(new Date()),
    updated_at: Timestamp.fromDate(new Date()),
  },
];

describe('Announcements', () => {
  function setup(getActiveAnnouncements: () => any) {
    TestBed.configureTestingModule({})
      .overrideProvider(AnnouncementsService, {
        useValue: { getActiveAnnouncements },
      });
    const fixture = TestBed.createComponent(Announcements);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup(() => EMPTY);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing when there are no announcements', () => {
    const fixture = setup(() => of([]));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('section')).toBeFalsy();
  });

  it('should render announcements when data exists', () => {
    const fixture = setup(() => of(mockAnnouncements));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('section')).toBeTruthy();
    expect(el.querySelectorAll('section > div').length).toBe(2);
  });

  it('should render markdown as HTML', () => {
    const fixture = setup(() => of(mockAnnouncements));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('strong')).toBeTruthy();
    expect(el.querySelector('a[href="https://example.com"]')).toBeTruthy();
  });

  it('should display the heading', () => {
    const fixture = setup(() => of(mockAnnouncements));
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h2')?.textContent).toContain('Announcements');
  });
});
