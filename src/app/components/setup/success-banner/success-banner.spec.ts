import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SuccessBanner } from './success-banner';
import { CreateBroadcastResponse } from '../../../services/functions.service';

const mockResult: CreateBroadcastResponse = {
  youtubeId: 'yt-abc',
  scheduledStartTime: '2026-03-15T10:00:00Z',
  publishedAt: '2026-03-12T08:00:00Z',
  watchUrl: 'https://youtube.com/watch?v=yt-abc',
  firestoreId: 'fs-123',
};

describe('SuccessBanner', () => {
  let fixture: ComponentFixture<SuccessBanner>;
  let component: SuccessBanner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessBanner);
    fixture.componentRef.setInput('result', mockResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Broadcast scheduled!" text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Broadcast scheduled!');
  });

  it('should render the watch URL as a link', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.href).toBe('https://youtube.com/watch?v=yt-abc');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
    expect(link.textContent).toContain('https://youtube.com/watch?v=yt-abc');
  });

  it('should emit dismissed when the dismiss button is clicked', () => {
    let dismissed = false;
    component.dismissed.subscribe(() => (dismissed = true));

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    button.click();
    expect(dismissed).toBe(true);
  });

  it('should have correct aria-label on dismiss button', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Dismiss success notification');
  });
});
