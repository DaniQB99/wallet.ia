import { describe, it, expect } from 'vitest';
import { getSupabaseErrorI18nKey, getAuthErrorI18nKey } from './supabaseErrors';

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

describe('getAuthErrorI18nKey utility', () => {
  it('should map invalid credentials errors', () => {
    expect(getAuthErrorI18nKey('Invalid login credentials')).toBe('authErrorInvalidCredentials');
    expect(getAuthErrorI18nKey('invalid_grant')).toBe('authErrorInvalidCredentials');
  });

  it('should map email not confirmed', () => {
    expect(getAuthErrorI18nKey('Email not confirmed')).toBe('authErrorEmailNotConfirmed');
  });

  it('should map user already exists', () => {
    expect(getAuthErrorI18nKey('User already registered')).toBe('authErrorUserAlreadyExists');
  });

  it('should map rate limit errors', () => {
    expect(getAuthErrorI18nKey('over_email_send_rate_limit')).toBe('authErrorTooManyRequests');
    expect(getAuthErrorI18nKey('Too many requests')).toBe('authErrorTooManyRequests');
  });

  it('should map expired tokens', () => {
    expect(getAuthErrorI18nKey('Token has expired')).toBe('authErrorTokenExpired');
  });

  it('should fallback to authErrorGeneric on empty or unknown error', () => {
    expect(getAuthErrorI18nKey(null)).toBe('authErrorGeneric');
    expect(getAuthErrorI18nKey('Some random network error')).toBe('authErrorGeneric');
  });
});

