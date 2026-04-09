export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message?: string
  ) {
    super(message || code);
    this.name = 'DomainError';
  }
}

// Error codes
export const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';
export const REGISTRATION_FAILED = 'REGISTRATION_FAILED';
export const INVALID_TOKEN = 'INVALID_TOKEN';
export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';
export const MEMBER_ALREADY_EXISTS = 'MEMBER_ALREADY_EXISTS';
export const INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND';
export const INVITATION_EXPIRED = 'INVITATION_EXPIRED';
export const INVITATION_USED = 'INVITATION_USED';
export const PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND';
export const FORBIDDEN = 'FORBIDDEN';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export const EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED';
