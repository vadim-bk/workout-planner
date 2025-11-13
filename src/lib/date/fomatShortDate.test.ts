import { it, expect } from 'vitest';
import { formatShortDate } from './formatShortDate';

it('formats date in short Ukrainian format', () => {
  const date = new Date(2024, 7, 25);
  const result = formatShortDate(date);

  expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
});

it('formats dates consistently', () => {
  const date = new Date(2024, 7, 5);
  const result = formatShortDate(date);

  expect(result).toContain('2024');
});
