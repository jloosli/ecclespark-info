import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { Results } from './results';
import { Stream } from '../../../models/stream';

const mockStreams: Stream[] = [
  {
    id: '1',
    title: 'Stream 1',
    scheduled_at: Timestamp.fromDate(new Date()),
    status: 'SCHEDULED',
    stream_id: 'sid-1',
  },
  {
    id: '2',
    title: 'Stream 2',
    scheduled_at: Timestamp.fromDate(new Date()),
    status: 'BROADCAST',
    stream_id: 'sid-2',
  },
  {
    id: '3',
    title: 'Stream 3',
    scheduled_at: Timestamp.fromDate(new Date()),
    status: 'SCHEDULED',
    stream_id: 'sid-3',
  },
];

describe('Results', () => {
  let component: Results;
  let fixture: ComponentFixture<Results>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Results],
    }).compileComponents();

    fixture = TestBed.createComponent(Results);
    fixture.componentRef.setInput('streams', []);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct number of app-card elements', () => {
    fixture.componentRef.setInput('streams', mockStreams);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-card');
    expect(cards.length).toBe(3);
  });

  it('should render zero cards for empty streams', () => {
    fixture.componentRef.setInput('streams', []);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('app-card');
    expect(cards.length).toBe(0);
  });

  it('should render the heading', () => {
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent).toContain('Upcoming Broadcasts');
  });
});
