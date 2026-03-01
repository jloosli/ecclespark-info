import { TestBed } from '@angular/core/testing';
import { BroadcastForm } from './broadcast-form';

describe('BroadcastForm', () => {
  it('should create', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have default title', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    expect(fixture.componentInstance.title).toBe('Eccles Park Ward Sacrament Meeting');
  });

  it('should not emit when fields are empty', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: unknown[] = [];
    fixture.componentRef.setInput('disabled', false);
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(0);
  });

  it('should emit formSubmit with correct params', () => {
    const fixture = TestBed.createComponent(BroadcastForm);
    const emitted: unknown[] = [];
    fixture.componentInstance.formSubmit.subscribe((v) => emitted.push(v));
    fixture.componentInstance.title = 'Test Broadcast';
    fixture.componentInstance.date = '2026-03-01';
    fixture.componentInstance.time = '10:00';
    fixture.componentInstance.onSubmit();
    expect(emitted).toHaveLength(1);
  });
});
