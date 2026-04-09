export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface InvitationDTO {
  id: string;
  email: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface FinancialSpaceDetailDTO {
  id: string;
  name: string;
  currency: string;
  members: import('./auth').MemberDTO[];
}

export interface MeResponse {
  profile: import('./auth').UserProfileDTO;
  financialSpace: import('./auth').FinancialSpaceDTO;
  role: import('./auth').MemberRole;
}
