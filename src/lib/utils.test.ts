import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (utils)', () => {
  it('combina clases correctamente', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('omite valores falsy', () => {
    expect(cn('a', false, 'b')).toBe('a b');
  });
});
