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

// M2 — Profile & Debt errors
export const DEBT_NOT_FOUND = 'DEBT_NOT_FOUND';
export const DEBT_ALREADY_ARCHIVED = 'DEBT_ALREADY_ARCHIVED';
export const DEBT_NOT_IN_SPACE = 'DEBT_NOT_IN_SPACE';
export const DEBT_NOT_VISIBLE = 'DEBT_NOT_VISIBLE';
export const INSUFFICIENT_INCOME_OR_CAPITAL = 'INSUFFICIENT_INCOME_OR_CAPITAL';
export const INVALID_INTEREST_RATE = 'INVALID_INTEREST_RATE';
export const INVALID_MONTHLY_ALLOCATION = 'INVALID_MONTHLY_ALLOCATION';
export const ORIGINAL_BALANCE_IMMUTABLE = 'ORIGINAL_BALANCE_IMMUTABLE';
export const SHARING_OWNER_ONLY = 'SHARING_OWNER_ONLY';
export const INVALID_FIXED_EXPENSES = 'INVALID_FIXED_EXPENSES';
