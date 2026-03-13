import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, EMPTY } from 'rxjs';
import { BroadcastList } from './broadcast-list';
import { StreamsService } from '../../../services/streams.service';
import { Stream } from '../../../models/stream';

function makeStream(overrides: Partial<Stream> & { id: string; title: string }): Stream {
  return {
    scheduled_at: { toDate: () => new Date('2026-03-15') } as any,
    status: 'SCHEDULED',
    ...overrides,
  } as Stream;
}

describe('BroadcastList', () => {
  let fixture: ComponentFixture<BroadcastList>;
  let component: BroadcastList;

  function setup(streams$: ReturnType<StreamsService['getActiveStreams']>) {
    TestBed.configureTestingModule({
      imports: [BroadcastList],
      providers: [
        {
          provide: StreamsService,
          useValue: { getActiveStreams: () => streams$ },
        },
      ],
    });
    fixture = TestBed.createComponent(BroadcastList);
    component = fixture.componentInstance;
  }

  it('should show loading text when streams is null', async () => {
    setup(EMPTY);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading...');
  });

  it('should show "No upcoming broadcasts" for an empty array', async () => {
    setup(of([]));
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No upcoming broadcasts');
  });

  it('should render stream items', async () => {
    const streams = [
      makeStream({ id: '1', title: 'Morning Service', status: 'SCHEDULED' }),
      makeStream({ id: '2', title: 'Evening Service', status: 'BROADCAST' }),
    ];
    setup(of(streams));
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Morning Service');
    expect(items[0].textContent).toContain('SCHEDULED');
    expect(items[1].textContent).toContain('Evening Service');
    expect(items[1].textContent).toContain('BROADCAST');
  });
});
