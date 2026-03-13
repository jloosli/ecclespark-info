import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('should transform bold text', () => {
    const result = pipe.transform('**hello**');
    expect(result).toContain('<strong>hello</strong>');
  });

  it('should transform links', () => {
    const result = pipe.transform('[link](https://example.com)');
    expect(result).toContain('<a href="https://example.com">link</a>');
  });

  it('should pass through plain text', () => {
    const result = pipe.transform('plain text');
    expect(result).toContain('plain text');
  });

  it('should return empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return empty string for null-like input', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });
});
