import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { Stream } from '../../../models/stream';
import { Card } from './card';

const mockStream: Stream = {
  title: 'Test Stream',
  scheduled_at: Timestamp.fromDate(new Date('2026-03-15T10:00:00')),
  status: 'SCHEDULED',
  stream_id: 'test-id',
};

describe('Card', () => {
  let component: Card;
  let fixture: ComponentFixture<Card>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Card],
    }).compileComponents();

    fixture = TestBed.createComponent(Card);
    fixture.componentRef.setInput('stream', mockStream);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formattedDate()', () => {
    it('should return a formatted date string for a valid scheduled_at', () => {
      const formatted = component.formattedDate();
      expect(formatted).toContain('March');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Sunday');
      expect(formatted).toContain('15');
    });

    it('should return empty string when scheduled_at has no toDate', () => {
      fixture.componentRef.setInput('stream', {
        ...mockStream,
        scheduled_at: null,
      });
      expect(component.formattedDate()).toBe('');
    });
  });

  describe('youtubeUrl()', () => {
    it('should use youtube_id when present', () => {
      fixture.componentRef.setInput('stream', {
        ...mockStream,
        youtube_id: 'yt-123',
        stream_id: 'stream-456',
      });
      expect(component.youtubeUrl()).toBe('https://youtube.com/live/yt-123');
    });

    it('should fall back to stream_id when youtube_id is absent', () => {
      fixture.componentRef.setInput('stream', {
        ...mockStream,
        youtube_id: undefined,
        stream_id: 'stream-456',
      });
      expect(component.youtubeUrl()).toBe('https://youtube.com/live/stream-456');
    });

    it('should return null when both youtube_id and stream_id are absent', () => {
      fixture.componentRef.setInput('stream', {
        ...mockStream,
        youtube_id: undefined,
        stream_id: undefined,
      });
      expect(component.youtubeUrl()).toBeNull();
    });
  });

  describe('statusClasses()', () => {
    it('should return LIVE classes', () => {
      fixture.componentRef.setInput('stream', { ...mockStream, status: 'LIVE' });
      expect(component.statusClasses()).toBe('bg-red-500 text-white animate-pulse');
    });

    it('should return SCHEDULED classes', () => {
      fixture.componentRef.setInput('stream', { ...mockStream, status: 'SCHEDULED' });
      expect(component.statusClasses()).toBe('bg-blue-100 text-blue-800');
    });

    it('should return ENDED classes', () => {
      fixture.componentRef.setInput('stream', { ...mockStream, status: 'ENDED' });
      expect(component.statusClasses()).toBe('bg-gray-100 text-gray-600');
    });

    it('should return CANCELLED classes', () => {
      fixture.componentRef.setInput('stream', { ...mockStream, status: 'CANCELLED' });
      expect(component.statusClasses()).toBe('bg-gray-100 text-gray-500 line-through');
    });
  });
});
