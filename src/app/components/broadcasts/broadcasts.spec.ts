import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, EMPTY, Subject } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

import { Broadcasts } from './broadcasts';
import { StreamsService } from '../../services/streams.service';
import { Stream } from '../../models/stream';

const mockStreams: Stream[] = [
  {
    id: '1',
    title: 'Stream 1',
    scheduled_at: Timestamp.fromDate(new Date()),
    status: 'SCHEDULED',
  },
  {
    id: '2',
    title: 'Stream 2',
    scheduled_at: Timestamp.fromDate(new Date()),
    status: 'LIVE',
  },
];

describe('Broadcasts', () => {
  function setup(getActiveStreams: () => any) {
    TestBed.configureTestingModule({})
      .overrideProvider(StreamsService, {
        useValue: { getActiveStreams },
      });
    const fixture = TestBed.createComponent(Broadcasts);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = setup(() => EMPTY);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('loading state', () => {
    it('should show loading when service has not emitted', () => {
      const fixture = setup(() => EMPTY);
      expect(fixture.componentInstance.dataState()).toBe('loading');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-loading')).toBeTruthy();
      expect(el.querySelector('app-results')).toBeFalsy();
      expect(el.querySelector('app-no-results')).toBeFalsy();
    });
  });

  describe('no-results state', () => {
    it('should show no-results when service returns empty array', () => {
      const fixture = setup(() => of([]));
      expect(fixture.componentInstance.dataState()).toBe('no-results');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-no-results')).toBeTruthy();
      expect(el.querySelector('app-loading')).toBeFalsy();
      expect(el.querySelector('app-results')).toBeFalsy();
    });
  });

  describe('results state', () => {
    it('should show results when service returns streams', () => {
      const fixture = setup(() => of(mockStreams));
      expect(fixture.componentInstance.dataState()).toBe('results');
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-results')).toBeTruthy();
      expect(el.querySelector('app-loading')).toBeFalsy();
      expect(el.querySelector('app-no-results')).toBeFalsy();
    });
  });

  describe('transitions', () => {
    it('should transition from loading to results when observable emits', () => {
      const subject = new Subject<Stream[]>();
      const fixture = setup(() => subject.asObservable());

      expect(fixture.componentInstance.dataState()).toBe('loading');

      subject.next(mockStreams);
      fixture.detectChanges();

      expect(fixture.componentInstance.dataState()).toBe('results');
    });
  });
});
