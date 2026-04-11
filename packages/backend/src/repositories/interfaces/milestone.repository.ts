import type { Milestone, MilestoneType } from '@prisma/client';
import type { TransactionContext } from '../../shared/types';

export interface CreateMilestoneInput {
  financialSpaceId: string;
  milestoneType: MilestoneType;
  debtId?: string;
  message: string;
}

export interface IMilestoneRepository {
  create(input: CreateMilestoneInput, tx?: TransactionContext): Promise<Milestone>;
  findByFinancialSpaceId(spaceId: string): Promise<Milestone[]>;
  findByTypeAndScope(
    spaceId: string,
    type: MilestoneType,
    debtId?: string | null,
    tx?: TransactionContext
  ): Promise<Milestone | null>;
  acknowledgeById(id: string): Promise<Milestone>;
}
