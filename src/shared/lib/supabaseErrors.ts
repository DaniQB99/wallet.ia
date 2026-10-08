export const getSupabaseErrorI18nKey = (errorCode: string): string => {
  switch (errorCode) {
    case 'invalid_code':
      return 'errorAcceptInvitationInvalidCode';
    case 'rate_limited':
      return 'errorAcceptInvitationRateLimited';
    case 'own_code':
      return 'errorAcceptInvitationOwnCode';
    case 'already_linked':
      return 'errorAcceptInvitationAlreadyLinked';
    default:
      return 'errorGeneric';
  }
};

/**
 * Mapea mensajes o códigos de error nativos de Supabase Auth a claves de traducción.
 */
export const getAuthErrorI18nKey = (rawError: string | null | undefined): string => {
  if (!rawError) return 'authErrorGeneric';
  const lower = rawError.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'authErrorInvalidCredentials';
  }
  if (lower.includes('email not confirmed')) {
    return 'authErrorEmailNotConfirmed';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'authErrorUserAlreadyExists';
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('over_email_send_rate_limit')
  ) {
    return 'authErrorTooManyRequests';
  }
  if (
    lower.includes('expired') ||
    lower.includes('invalid token') ||
    lower.includes('otp_expired') ||
    lower.includes('recovery link is invalid')
  ) {
    return 'authErrorTokenExpired';
  }
  return 'authErrorGeneric';
};

