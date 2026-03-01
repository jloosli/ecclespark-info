import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { Stream } from '../../../models/stream';
import { Card } from './card';

const mockStream: Stream = {
  title: 'Test Stream',
  scheduled_at: Timestamp.fromDate(new Date()),
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
});
