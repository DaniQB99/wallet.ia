import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredCookieConsent,
  saveCookieConsent,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  COOKIE_NAME,
  CURRENT_POLICY_VERSION,
} from './cookieConsent';

describe('cookieConsent utility', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
  });

  it('should return null when no cookie preferences are stored', () => {
    expect(getStoredCookieConsent()).toBeNull();
  });

  it('should return parsed preferences from localStorage if present', () => {
    const prefs = {
      status: 'accepted' as const,
      necessary: true,
      analytics: true,
      preferences: true,
      timestamp: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

    const result = getStoredCookieConsent();
    expect(result).toEqual(prefs);
  });

  it('should fallback to legacy storage key when new key is missing', () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'true');

    const result = getStoredCookieConsent();
    expect(result).not.toBeNull();
    expect(result?.status).toBe('accepted');
    expect(result?.necessary).toBe(true);
    expect(result?.analytics).toBe(true);
    expect(result?.version).toBe(CURRENT_POLICY_VERSION);
  });

  it('should save cookie consent to localStorage and set necessary to true', async () => {
    const saved = await saveCookieConsent({
      status: 'rejected',
      analytics: false,
      preferences: false,
    });

    expect(saved.necessary).toBe(true);
    expect(saved.status).toBe('rejected');
    expect(saved.analytics).toBe(false);
    expect(saved.preferences).toBe(false);

    const stored = getStoredCookieConsent();
    expect(stored?.status).toBe('rejected');
    expect(stored?.necessary).toBe(true);
  });
});
