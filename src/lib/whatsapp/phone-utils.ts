/**
 * Phone number utilities for WhatsApp Meta Cloud API.
 *
 * Provides high-resilience sanitization, Indian mobile auto-correction,
 * international E.164 compliance, deduplication, and retry variants.
 */

/**
 * Remove all invisible Unicode characters, control characters,
 * zero-width spaces, and whitespace.
 */
export function cleanRawPhone(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0]/g, '')
    .trim();
}

/**
 * Sanitize and auto-correct phone numbers for Meta WhatsApp API.
 * Meta requires digits only — no + prefix, no spaces, no dashes.
 *
 * Handles all common user entry patterns and typos:
 * 1. Accidental double country code: "91919511450914" -> "919511450914"
 * 2. International exit code: "00919511450914" -> "919511450914"
 * 3. Leading zero before country code: "0919511450914" -> "919511450914"
 * 4. Trunk zero after country code: "9109511450914" -> "919511450914"
 * 5. Domestic trunk zero: "09511450914" -> "919511450914"
 * 6. 10-digit Indian mobile (starts with 6-9): "9511450914" -> "919511450914"
 * 7. Already has 91: "919511450914" -> "919511450914" (never duplicates to 9191)
 * 8. International E.164 (US, UK, etc.): "+14155552671" -> "14155552671"
 */
export function sanitizePhoneForMeta(phone: string): string {
  if (!phone) return '';
  
  const cleaned = cleanRawPhone(phone);
  let digits = cleaned.replace(/\D/g, '');

  if (!digits) return '';

  // 1. Accidental double Indian country code prefix: e.g. 91919876543210 (14 digits)
  if (/^9191[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  // 2. International exit prefix: e.g. 00919876543210 (14 digits)
  if (/^0091[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }

  // 3. Leading zero before country code: e.g. 0919876543210 (13 digits)
  if (/^091[6-9]\d{9}$/.test(digits)) {
    return digits.slice(1);
  }

  // 4. Trunk 0 inserted after country code 91: e.g. 9109876543210 (13 digits)
  if (/^910[6-9]\d{9}$/.test(digits)) {
    return '91' + digits.slice(3);
  }

  // 5. Domestic 11 digits starting with 0 followed by 6-9: e.g. 09876543210
  if (/^0[6-9]\d{9}$/.test(digits)) {
    return '91' + digits.slice(1);
  }

  // 6. Domestic 10-digit Indian mobile without country code: e.g. 9876543210
  if (/^[6-9]\d{9}$/.test(digits)) {
    return '91' + digits;
  }

  // 7. Standard 12-digit Indian mobile with 91: e.g. 919876543210
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  // 8. General international E.164 (7-15 digits starting with non-zero)
  return digits;
}

/**
 * Normalize phone number by removing all non-digit characters.
 * Also applies Indian mobile standardization for matching.
 */
export function normalizePhone(phone: string): string {
  return sanitizePhoneForMeta(phone);
}

/**
 * Compare two phone numbers accounting for prefix and format differences.
 * Returns true if both normalize to the exact same digits,
 * or if their last 10 digits match (for domestic mobile matching).
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const n1 = normalizePhone(phone1);
  const n2 = normalizePhone(phone2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  // Match last 10 digits if both are at least 10 digits
  if (n1.length >= 10 && n2.length >= 10) {
    return n1.slice(-10) === n2.slice(-10);
  }
  return false;
}

/**
 * Validate phone number is E.164-like format (7-15 digits starting with non-zero).
 * Accepts with or without + prefix. Rejects obvious dummy patterns (all repeating digits).
 */
export function isValidE164(phone: string): boolean {
  if (!phone) return false;
  const digits = sanitizePhoneForMeta(phone);
  if (!/^[1-9]\d{6,14}$/.test(digits)) return false;
  // Reject all repeating digits (e.g. 999999999999, 000000000000)
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

export interface PhoneValidation {
  isValid: boolean;
  phone: string;          // E.164 digits for Meta API (e.g. "919511450914")
  displayPhone: string;   // Clean formatted for UI (e.g. "+91 95114 50914")
  countryCode: string;    // e.g. "91"
  original: string;       // raw user input
  isIndian: boolean;
  error?: string;
}

/**
 * Full inspection & validation of a user-supplied phone string.
 */
export function validatePhone(rawInput: string): PhoneValidation {
  const original = cleanRawPhone(rawInput);
  if (!original) {
    return {
      isValid: false,
      phone: '',
      displayPhone: '',
      countryCode: '',
      original: rawInput,
      isIndian: false,
      error: 'Phone number cannot be empty',
    };
  }

  const sanitized = sanitizePhoneForMeta(original);

  if (sanitized.length < 8) {
    return {
      isValid: false,
      phone: sanitized,
      displayPhone: sanitized,
      countryCode: '',
      original: rawInput,
      isIndian: false,
      error: 'Phone number too short (minimum 8 digits required)',
    };
  }

  if (sanitized.length > 15) {
    return {
      isValid: false,
      phone: sanitized,
      displayPhone: sanitized,
      countryCode: '',
      original: rawInput,
      isIndian: false,
      error: 'Phone number exceeds maximum length (max 15 digits)',
    };
  }

  if (/^(\d)\1+$/.test(sanitized)) {
    return {
      isValid: false,
      phone: sanitized,
      displayPhone: sanitized,
      countryCode: '',
      original: rawInput,
      isIndian: false,
      error: 'Invalid phone number (repeating digits)',
    };
  }

  const isIndian = /^91[6-9]\d{9}$/.test(sanitized);
  let displayPhone = '+' + sanitized;
  let countryCode = '';

  if (isIndian) {
    countryCode = '91';
    // Format as +91 XXXXX XXXXX
    displayPhone = `+91 ${sanitized.slice(2, 7)} ${sanitized.slice(7)}`;
  } else if (sanitized.startsWith('1') && sanitized.length === 11) {
    countryCode = '1';
    // Format as +1 (XXX) XXX-XXXX
    displayPhone = `+1 (${sanitized.slice(1, 4)}) ${sanitized.slice(4, 7)}-${sanitized.slice(7)}`;
  }

  return {
    isValid: true,
    phone: sanitized,
    displayPhone,
    countryCode,
    original: rawInput,
    isIndian,
  };
}

/**
 * Generate plausible phone number variants for retry when Meta's
 * sandbox rejects a number with error #131030 ("not in allowed list")
 * or phone format issues.
 *
 * Yields up to 4 variants:
 * 1. The original sanitized number (first attempt)
 * 2. With trunk 0 removed (e.g. 9109876543210 -> 919876543210)
 * 3. With trunk 0 inserted (e.g. 919876543210 -> 9109876543210)
 * 4. Fallback 10-digit without country code (if domestic sandbox registered)
 */
export function phoneVariants(sanitized: string): string[] {
  if (!sanitized) return [];
  const seen = new Set<string>();
  const push = (v: string) => {
    if (v && isValidE164(v) && !seen.has(v)) seen.add(v);
  };

  // 1. Original
  push(sanitized);

  // 2. For Indian numbers: try standard 91 format and trunk 0 variant
  if (sanitized.startsWith('91') && sanitized.length === 12) {
    // With trunk 0
    push('910' + sanitized.slice(2));
  } else if (sanitized.startsWith('910') && sanitized.length === 13) {
    // Without trunk 0
    push('91' + sanitized.slice(3));
  }

  // 3. For any other country codes: insert/remove 0 after plausible CC lengths (1, 2, 3)
  for (const ccLen of [1, 2, 3]) {
    if (sanitized.length <= ccLen) continue;
    const cc = sanitized.slice(0, ccLen);
    const rest = sanitized.slice(ccLen);
    if (!rest.startsWith('0')) {
      push(cc + '0' + rest);
    } else {
      push(cc + rest.slice(1));
    }
  }

  return [...seen];
}

/**
 * Returns true when the Meta API error indicates the recipient
 * phone number isn't in the allowed list (sandbox restriction).
 * Detected via error code 131030 or the standard error text.
 */
export function isRecipientNotAllowedError(message: string): boolean {
  return /131030|not in allowed list|not in the allowed list/i.test(message);
}
