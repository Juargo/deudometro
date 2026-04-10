import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DebtUpdaterSkill } from '../../../src/skills/debt-updater.skill';
import {
  DomainError,
  DEBT_NOT_FOUND,
  DEBT_NOT_IN_SPACE,
  DEBT_ALREADY_ARCHIVED,
} from '../../../src/shared/errors';
import { makeDebt } from './helpers';
import { Decimal } from '@prisma/client/runtime/library';

const mockDebtRepo = {
  create: vi.fn(),
  findById: vi.fn(),
  findByFinancialSpaceId: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  updateShared: vi.fn(),
};

describe('DebtUpdaterSkill', () => {
  let skill: DebtUpdaterSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new DebtUpdaterSkill(mockDebtRepo);
  });

  it('updates a debt successfully', async () => {
    const debt = makeDebt({ status: 'active' });
    const updatedDebt = makeDebt({ label: 'Tarjeta Actualizada' });

    mockDebtRepo.findById.mockResolvedValue(debt);
    mockDebtRepo.update.mockResolvedValue(updatedDebt);

    const result = await skill.update({
      debtId: 'debt-1',
      financialSpaceId: 'space-1',
      updates: { label: 'Tarjeta Actualizada' },
    });

    expect(result).toEqual(updatedDebt);
    expect(mockDebtRepo.update).toHaveBeenCalledWith('debt-1', { label: 'Tarjeta Actualizada' });
  });

  it('throws DEBT_NOT_FOUND when debt does not exist', async () => {
    mockDebtRepo.findById.mockResolvedValue(null);

    await expect(
      skill.update({
        debtId: 'nonexistent',
        financialSpaceId: 'space-1',
        updates: {},
      })
    ).rejects.toMatchObject({ code: DEBT_NOT_FOUND, httpStatus: 404 });
  });

  it('throws DEBT_NOT_IN_SPACE when debt belongs to another space', async () => {
    const debt = makeDebt({ financialSpaceId: 'other-space' });
    mockDebtRepo.findById.mockResolvedValue(debt);

    await expect(
      skill.update({
        debtId: 'debt-1',
        financialSpaceId: 'space-1',
        updates: {},
      })
    ).rejects.toMatchObject({ code: DEBT_NOT_IN_SPACE, httpStatus: 403 });
  });

  it('throws DEBT_ALREADY_ARCHIVED for a non-active debt', async () => {
    const debt = makeDebt({ status: 'frozen' });
    mockDebtRepo.findById.mockResolvedValue(debt);

    await expect(
      skill.update({
        debtId: 'debt-1',
        financialSpaceId: 'space-1',
        updates: { label: 'New Label' },
      })
    ).rejects.toMatchObject({ code: DEBT_ALREADY_ARCHIVED, httpStatus: 409 });
  });
});
