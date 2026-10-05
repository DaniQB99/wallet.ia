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
