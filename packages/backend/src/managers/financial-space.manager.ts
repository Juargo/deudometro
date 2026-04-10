import type { FinancialSpace, FinancialSpaceMember } from '@prisma/client';
import type { IFinancialSpaceRepository } from '../repositories/interfaces/financial-space.repository';
import type { IFinancialSpaceMemberRepository } from '../repositories/interfaces/financial-space-member.repository';
import type { RequestContext } from '../shared/types';
import { DomainError, PROFILE_NOT_FOUND } from '../shared/errors';

export class FinancialSpaceManager {
  constructor(
    private readonly financialSpaceRepo: IFinancialSpaceRepository,
    private readonly memberRepo: IFinancialSpaceMemberRepository
  ) {}

  async getSpace(context: RequestContext): Promise<{ space: FinancialSpace; members: FinancialSpaceMember[] }> {
    const space = await this.financialSpaceRepo.findById(context.financialSpaceId!);
    if (!space) {
      throw new DomainError(PROFILE_NOT_FOUND, 404, 'Financial space not found');
    }

    const members = await this.memberRepo.findAllBySpace(space.id);
    return { space, members };
  }
}
