import { describe, it, expect } from 'vitest';
import {
  sanitizePhoneForMeta,
  normalizePhone,
  phonesMatch,
  isValidE164,
  validatePhone,
  phoneVariants,
  sanitizeTemplatePhoneNumber,
} from './phone-utils';

describe('sanitizePhoneForMeta', () => {
  it('handles standard 10-digit Indian mobile numbers by auto-prepending 91', () => {
    expect(sanitizePhoneForMeta('9511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('8882644630')).toBe('918882644630');
    expect(sanitizePhoneForMeta('7860606786')).toBe('917860606786');
    expect(sanitizePhoneForMeta('6390049995')).toBe('916390049995');
  });

  it('handles numbers with domestic trunk 0 (11 digits)', () => {
    expect(sanitizePhoneForMeta('09511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('08882644630')).toBe('918882644630');
  });

  it('keeps numbers that already have 91 prefix without duplicating', () => {
    expect(sanitizePhoneForMeta('919511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('+919511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('+91 95114 50914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('+91-95114-50914')).toBe('919511450914');
  });

  it('auto-corrects accidental double 91 (9191...)', () => {
    expect(sanitizePhoneForMeta('91919511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('+91919511450914')).toBe('919511450914');
  });

  it('auto-corrects 0091 international exit code and 091 prefix', () => {
    expect(sanitizePhoneForMeta('00919511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('0919511450914')).toBe('919511450914');
    expect(sanitizePhoneForMeta('9109511450914')).toBe('919511450914');
  });

  it('preserves valid international numbers for other countries', () => {
    expect(sanitizePhoneForMeta('+1 (415) 555-2671')).toBe('14155552671');
    expect(sanitizePhoneForMeta('+44 7123 456789')).toBe('447123456789');
  });

  it('handles empty or whitespace inputs gracefully', () => {
    expect(sanitizePhoneForMeta('')).toBe('');
    expect(sanitizePhoneForMeta('   ')).toBe('');
  });
});

describe('validatePhone', () => {
  it('validates and formats a 10-digit Indian number', () => {
    const res = validatePhone('9511450914');
    expect(res.isValid).toBe(true);
    expect(res.phone).toBe('919511450914');
    expect(res.displayPhone).toBe('+91 95114 50914');
    expect(res.countryCode).toBe('91');
    expect(res.isIndian).toBe(true);
  });

  it('validates a number already containing 91', () => {
    const res = validatePhone('919511450914');
    expect(res.isValid).toBe(true);
    expect(res.phone).toBe('919511450914');
    expect(res.displayPhone).toBe('+91 95114 50914');
    expect(res.countryCode).toBe('91');
  });

  it('rejects short numbers', () => {
    const res = validatePhone('12345');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('too short');
  });

  it('rejects repeating digits dummy numbers', () => {
    const res = validatePhone('0000000000');
    expect(res.isValid).toBe(false);
  });
});

describe('phonesMatch', () => {
  it('matches 10-digit number with 12-digit number having 91', () => {
    expect(phonesMatch('9511450914', '919511450914')).toBe(true);
    expect(phonesMatch('+91 95114 50914', '9511450914')).toBe(true);
    expect(phonesMatch('09511450914', '919511450914')).toBe(true);
  });
});

describe('phoneVariants', () => {
  it('generates variants including the original', () => {
    const variants = phoneVariants('919511450914');
    expect(variants[0]).toBe('919511450914');
    expect(variants.length).toBeGreaterThan(1);
  });
});

describe('sanitizeTemplatePhoneNumber', () => {
  it('formats Indian toll-free numbers (1800 / 1860) with +91 international prefix so dialer does not mistake for US +1', () => {
    expect(sanitizeTemplatePhoneNumber('+9118008890860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('9118008890860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('+91 1800 8890 860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('+91-1800-889-0860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('018008890860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('18008890860')).toBe('+9118008890860');
    expect(sanitizeTemplatePhoneNumber('1800 8890 860')).toBe('+9118008890860');

    // 1860 series
    expect(sanitizeTemplatePhoneNumber('+9118601234567')).toBe('+9118601234567');
    expect(sanitizeTemplatePhoneNumber('9118601234567')).toBe('+9118601234567');
    expect(sanitizeTemplatePhoneNumber('18601234567')).toBe('+9118601234567');
  });

  it('preserves and formats international code for normal mobile numbers', () => {
    expect(sanitizeTemplatePhoneNumber('9511450914')).toBe('+919511450914');
    expect(sanitizeTemplatePhoneNumber('+919511450914')).toBe('+919511450914');
    expect(sanitizeTemplatePhoneNumber('+91 95114 50914')).toBe('+919511450914');
    expect(sanitizeTemplatePhoneNumber('+1 (555) 802-3973')).toBe('+15558023973');
  });
});
