import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtArchiverSkill } from '../../../src/skills/debt-archiver.skill';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_ARCHIVED,
} from '../../../src/shared/errors';
import { makeDebt } from './helpers';

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};

describe('DebtArchiverSkill', () => {
  let skill: DebtArchiverSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new DebtArchiverSkill(mockDebtRepo);
  });

  it('archives an active debt to frozen status', async () => {
    const debt = makeDebt({ status: 'active' });
    const frozenDebt = makeDebt({ status: 'frozen' });

    mockDebtRepo.findById.mockResolvedValue(debt);
    mockDebtRepo.updateStatus.mockResolvedValue(frozenDebt);

    const result = await skill.archive({ debtId: 'debt-1', financialSpaceId: 'space-1' });

    expect(result.status).toBe('frozen');
    expect(mockDebtRepo.updateStatus).toHaveBeenCalledWith('debt-1', 'frozen');
  });

  it('throws DEBT_ALREADY_ARCHIVED for a non-active debt', async () => {
    const debt = makeDebt({ status: 'frozen' });
    mockDebtRepo.findById.mockResolvedValue(debt);

    await expect(
      skill.archive({ debtId: 'debt-1', financialSpaceId: 'space-1' })
    ).rejects.toMatchObject({ code: DEBT_ALREADY_ARCHIVED, httpStatus: 409 });
  });

  it('throws DEBT_NOT_IN_SPACE when debt belongs to another space', async () => {
    const debt = makeDebt({ financialSpaceId: 'other-space' });
    mockDebtRepo.findById.mockResolvedValue(debt);

    await expect(
      skill.archive({ debtId: 'debt-1', financialSpaceId: 'space-1' })
    ).rejects.toMatchObject({ code: DEBT_NOT_IN_SPACE, httpStatus: 403 });
  });

  it('throws DEBT_NOT_FOUND when debt does not exist', async () => {
    mockDebtRepo.findById.mockResolvedValue(null);

    await expect(
      skill.archive({ debtId: 'nonexistent', financialSpaceId: 'space-1' })
    ).rejects.toMatchObject({ code: DEBT_NOT_FOUND, httpStatus: 404 });
  });
});
