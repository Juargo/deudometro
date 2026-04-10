import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtSharingTogglerSkill } from '../../../src/skills/debt-sharing-toggler.skill';
import {
  DomainError,
  SHARING_OWNER_ONLY,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
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

describe('DebtSharingTogglerSkill', () => {
  let skill: DebtSharingTogglerSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new DebtSharingTogglerSkill(mockDebtRepo);
  });

  it('owner can set isShared=true', async () => {
    const debt = makeDebt({ isShared: false });
    const sharedDebt = makeDebt({ isShared: true });

    mockDebtRepo.findById.mockResolvedValue(debt);
    mockDebtRepo.updateShared.mockResolvedValue(sharedDebt);

    const result = await skill.toggle({
      debtId: 'debt-1',
      financialSpaceId: 'space-1',
      isShared: true,
      callerRole: 'owner',
    });

    expect(result.isShared).toBe(true);
    expect(mockDebtRepo.updateShared).toHaveBeenCalledWith('debt-1', true);
  });

  it('throws SHARING_OWNER_ONLY when caller is not an owner', async () => {
    await expect(
      skill.toggle({
        debtId: 'debt-1',
        financialSpaceId: 'space-1',
        isShared: true,
        callerRole: 'editor',
      })
    ).rejects.toMatchObject({ code: SHARING_OWNER_ONLY, httpStatus: 403 });

    expect(mockDebtRepo.findById).not.toHaveBeenCalled();
  });

  it('throws DEBT_NOT_FOUND when debt does not exist', async () => {
    mockDebtRepo.findById.mockResolvedValue(null);

    await expect(
      skill.toggle({
        debtId: 'nonexistent',
        financialSpaceId: 'space-1',
        isShared: true,
        callerRole: 'owner',
      })
    ).rejects.toMatchObject({ code: DEBT_NOT_FOUND, httpStatus: 404 });
  });

  it('throws DEBT_NOT_IN_SPACE when debt belongs to another space', async () => {
    const debt = makeDebt({ financialSpaceId: 'other-space' });
    mockDebtRepo.findById.mockResolvedValue(debt);

    await expect(
      skill.toggle({
        debtId: 'debt-1',
        financialSpaceId: 'space-1',
        isShared: true,
        callerRole: 'owner',
      })
    ).rejects.toMatchObject({ code: DEBT_NOT_IN_SPACE, httpStatus: 403 });
  });
});
