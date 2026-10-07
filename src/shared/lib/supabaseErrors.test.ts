import { describe, it, expect } from 'vitest';
import { getSupabaseErrorI18nKey } from './supabaseErrors';

describe('supabaseErrors utility', () => {
  it('should return errorAcceptInvitationInvalidCode for invalid_code', () => {
    expect(getSupabaseErrorI18nKey('invalid_code')).toBe('errorAcceptInvitationInvalidCode');
  });

  it('should return errorAcceptInvitationRateLimited for rate_limited', () => {
    expect(getSupabaseErrorI18nKey('rate_limited')).toBe('errorAcceptInvitationRateLimited');
  });

  it('should return errorAcceptInvitationOwnCode for own_code', () => {
    expect(getSupabaseErrorI18nKey('own_code')).toBe('errorAcceptInvitationOwnCode');
  });

  it('should return errorAcceptInvitationAlreadyLinked for already_linked', () => {
    expect(getSupabaseErrorI18nKey('already_linked')).toBe('errorAcceptInvitationAlreadyLinked');
  });

  it('should return errorGeneric for any unknown error code', () => {
    expect(getSupabaseErrorI18nKey('random_unknown_code')).toBe('errorGeneric');
    expect(getSupabaseErrorI18nKey('')).toBe('errorGeneric');
  });
});
