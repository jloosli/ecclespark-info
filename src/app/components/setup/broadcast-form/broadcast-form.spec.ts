import { TestBed } from '@angular/core/testing';
import { BroadcastForm, BroadcastFormParams } from './broadcast-form';

describe('BroadcastForm', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BroadcastForm],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have default title', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    expect(fixture.componentInstance.title).toBe('Eccles Park Ward Sacrament Meeting');
  });

  it('should default disabled to false', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    expect(fixture.componentInstance.disabled()).toBe(false);
  });

  it('should accept disabled input', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    fixture.componentRef.setInput('disabled', true);
    expect(fixture.componentInstance.disabled()).toBe(true);
  });

  it('should not emit when title is empty', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: BroadcastFormParams[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.title = '';
    fixture.componentInstance.date = '2026-03-01';
    fixture.componentInstance.time = '10:00';
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(0);
  });

  it('should not emit when date is empty', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: BroadcastFormParams[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.title = 'Test';
    fixture.componentInstance.date = '';
    fixture.componentInstance.time = '10:00';
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(0);
  });

  it('should not emit when time is empty', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: BroadcastFormParams[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.title = 'Test';
    fixture.componentInstance.date = '2026-03-01';
    fixture.componentInstance.time = '';
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(0);
  });

  it('should emit formSubmit with correct params shape', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: BroadcastFormParams[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.title = 'Test Broadcast';
    fixture.componentInstance.date = '2026-03-01';
    fixture.componentInstance.time = '10:00';
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(1);
    expect(emitted[0].title).toBe('Test Broadcast');
    expect(emitted[0].scheduledStartTime).toBeInstanceOf(Date);
    expect(emitted[0].scheduledStartTime.getFullYear()).toBe(2026);
    expect(emitted[0].scheduledStartTime.getMonth()).toBe(2); // March = 2 (0-indexed)
    expect(emitted[0].scheduledStartTime.getDate()).toBe(1);
    expect(emitted[0].scheduledStartTime.getHours()).toBe(10);
    expect(emitted[0].scheduledStartTime.getMinutes()).toBe(0);
  });
});
