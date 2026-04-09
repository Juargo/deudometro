export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  profile: UserProfileDTO;
  financialSpace: FinancialSpaceDTO;
}

export interface UserProfileDTO {
  id: string;
  displayName: string;
  email: string;
  monthlyIncome: number;
  availableCapital: number;
  createdAt: string;
}

export interface FinancialSpaceDTO {
  id: string;
  name: string;
  currency: string;
}

export type MemberRole = 'owner' | 'editor';

export interface MemberDTO {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
}
