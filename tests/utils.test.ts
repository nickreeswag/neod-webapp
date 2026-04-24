import { formatNumber, cn } from '@/lib/utils';

describe('utils', () => {
  describe('formatNumber', () => {
    it('formats a large number with commas (en-GB)', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('formats zero correctly', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('cn', () => {
    it('merges tailwind classes correctly', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('flex', 'flex-col')).toBe('flex flex-col');
    });
  });
});
