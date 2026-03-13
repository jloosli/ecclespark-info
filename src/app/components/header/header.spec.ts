import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the ward name heading', () => {
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1');
    expect(h1?.textContent).toContain('Eccles Park Ward Information');
  });

  it('should render the church name', () => {
    const el = fixture.nativeElement as HTMLElement;
    const p = el.querySelector('p');
    expect(p?.textContent).toContain('The Church of Jesus Christ of Latter-day Saints');
  });

  it('should have a header element', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')).toBeTruthy();
  });
});
