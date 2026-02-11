/**
 * validateReturnUrl Tests
 *
 * Tests for return URL validation to prevent open redirect vulnerabilities.
 *
 * @see FAS-7.1 - DAO Admin Suite extraction
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateReturnUrl } from './validateReturnUrl';

describe('validateReturnUrl', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('valid paths', () => {
    it('should allow /kyc path', () => {
      expect(validateReturnUrl('/kyc')).toBe('/kyc');
    });

    it('should allow /kyc subpaths', () => {
      expect(validateReturnUrl('/kyc/review')).toBe('/kyc/review');
    });

    it('should allow /members path', () => {
      expect(validateReturnUrl('/members')).toBe('/members');
    });

    it('should allow /members subpaths', () => {
      expect(validateReturnUrl('/members/pending')).toBe('/members/pending');
    });

    it('should allow /governance path', () => {
      expect(validateReturnUrl('/governance')).toBe('/governance');
    });

    it('should allow /governance subpaths', () => {
      expect(validateReturnUrl('/governance/proposals')).toBe('/governance/proposals');
    });

    it('should allow /treasury path', () => {
      expect(validateReturnUrl('/treasury')).toBe('/treasury');
    });

    it('should allow /treasury subpaths', () => {
      expect(validateReturnUrl('/treasury/payouts')).toBe('/treasury/payouts');
    });

    it('should allow /monitoring path', () => {
      expect(validateReturnUrl('/monitoring')).toBe('/monitoring');
    });

    it('should allow /monitoring subpaths', () => {
      expect(validateReturnUrl('/monitoring/canisters')).toBe('/monitoring/canisters');
    });

    it('should allow /moderation path', () => {
      expect(validateReturnUrl('/moderation')).toBe('/moderation');
    });

    it('should allow /moderation subpaths', () => {
      expect(validateReturnUrl('/moderation/reports')).toBe('/moderation/reports');
    });

    it('should redirect root path to default', () => {
      expect(validateReturnUrl('/')).toBe('/');
    });
  });

  describe('absolute URLs', () => {
    it('should reject http:// URLs', () => {
      expect(validateReturnUrl('http://evil.com')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected absolute redirect URL:',
        'http://evil.com'
      );
    });

    it('should reject https:// URLs', () => {
      expect(validateReturnUrl('https://evil.com/phishing')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected absolute redirect URL:',
        'https://evil.com/phishing'
      );
    });
  });

  describe('protocol-relative URLs', () => {
    it('should reject protocol-relative URLs', () => {
      expect(validateReturnUrl('//evil.com')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected protocol-relative redirect URL:',
        '//evil.com'
      );
    });

    it('should reject protocol-relative URLs with paths', () => {
      expect(validateReturnUrl('//evil.com/phishing/path')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected protocol-relative redirect URL:',
        '//evil.com/phishing/path'
      );
    });
  });

  describe('dangerous URI schemes', () => {
    it('should reject javascript: URIs', () => {
      expect(validateReturnUrl('javascript:alert(1)')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected dangerous URI scheme:',
        'javascript:alert(1)'
      );
    });

    it('should reject data: URIs', () => {
      expect(validateReturnUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected dangerous URI scheme:',
        'data:text/html,<script>alert(1)</script>'
      );
    });

    it('should reject case-insensitive javascript: URIs', () => {
      expect(validateReturnUrl('JaVaScRiPt:alert(1)')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected dangerous URI scheme:',
        'JaVaScRiPt:alert(1)'
      );
    });
  });

  describe('URL encoding bypass attempts', () => {
    it('should decode and reject encoded http URLs', () => {
      expect(validateReturnUrl('http%3A%2F%2Fevil.com')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected absolute redirect URL:',
        'http://evil.com'
      );
    });

    it('should decode and reject encoded protocol-relative URLs', () => {
      expect(validateReturnUrl('%2F%2Fevil.com')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected protocol-relative redirect URL:',
        '//evil.com'
      );
    });

    it('should decode valid paths correctly', () => {
      expect(validateReturnUrl('/kyc%2Freview')).toBe('/kyc/review');
    });
  });

  describe('non-relative paths', () => {
    it('should reject paths not starting with /', () => {
      expect(validateReturnUrl('kyc')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected non-relative path:',
        'kyc'
      );
    });

    it('should reject paths starting with text', () => {
      expect(validateReturnUrl('evil.com')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Rejected non-relative path:',
        'evil.com'
      );
    });
  });

  describe('allowlist validation', () => {
    it('should reject paths not in allowlist', () => {
      expect(validateReturnUrl('/admin')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Redirect path not in allowlist:',
        '/admin'
      );
    });

    it('should reject unknown paths', () => {
      expect(validateReturnUrl('/unknown/path')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Redirect path not in allowlist:',
        '/unknown/path'
      );
    });

    it('should reject dao-suite specific paths', () => {
      expect(validateReturnUrl('/dashboard')).toBe('/');
      expect(validateReturnUrl('/proposals')).toBe('/');
      expect(validateReturnUrl('/membership')).toBe('/');
    });
  });

  describe('null/undefined handling', () => {
    it('should return default for null', () => {
      expect(validateReturnUrl(null)).toBe('/');
    });

    it('should return default for undefined', () => {
      expect(validateReturnUrl(undefined)).toBe('/');
    });

    it('should return default for empty string', () => {
      expect(validateReturnUrl('')).toBe('/');
    });
  });

  describe('malformed input', () => {
    it('should handle malformed URL encoding', () => {
      expect(validateReturnUrl('%')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Failed to decode return URL:',
        '%'
      );
    });

    it('should handle incomplete percent encoding', () => {
      expect(validateReturnUrl('%2')).toBe('/');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Security] Failed to decode return URL:',
        '%2'
      );
    });
  });
});
