import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import type { IUserProfileRepository } from '../../repositories/interfaces/user-profile.repository';
import type { IFinancialSpaceMemberRepository } from '../../repositories/interfaces/financial-space-member.repository';

export function createSpaceResolver(
  userProfileRepo: IUserProfileRepository,
  memberRepo: IFinancialSpaceMemberRepository
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as unknown as AuthenticatedRequest;
    const { userId } = authReq.context;

    const profile = await userProfileRepo.findBySupabaseUserId(userId);
    if (!profile) {
      res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
      return;
    }

    const member = await memberRepo.findBySpaceAndUser(profile.financialSpaceId, userId);
    if (!member) {
      res.status(403).json({ error: 'FORBIDDEN' });
      return;
    }

    authReq.context.profileId = profile.id;
    authReq.context.financialSpaceId = profile.financialSpaceId;
    authReq.context.role = member.role;

    next();
  };
}
