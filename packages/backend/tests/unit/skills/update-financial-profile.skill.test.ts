import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateFinancialProfileSkill } from '../../../src/skills/update-financial-profile.skill';
import {
  DomainError,
  PROFILE_NOT_FOUND,
  INSUFFICIENT_INCOME_OR_CAPITAL,
  INVALID_MONTHLY_ALLOCATION,
} from '../../../src/shared/errors';
import { makeProfile } from './helpers';
import { Decimal } from '@prisma/client/runtime/library';

const mockProfileRepo = {
  findBySupabaseUserId: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

describe('UpdateFinancialProfileSkill', () => {
  let skill: UpdateFinancialProfileSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new UpdateFinancialProfileSkill(mockProfileRepo);
  });

  it('updates profile successfully with partial input', async () => {
    const profile = makeProfile({
      monthlyIncome: new Decimal('500000'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
    });
    const updated = makeProfile({ monthlyIncome: new Decimal('600000') });

    mockProfileRepo.findById.mockResolvedValue(profile);
    mockProfileRepo.update.mockResolvedValue(updated);

    const result = await skill.update({
      profileId: 'profile-1',
      monthlyIncome: new Decimal('600000'),
    });

    expect(result).toEqual(updated);
    expect(mockProfileRepo.update).toHaveBeenCalledWith(
      'profile-1',
      expect.objectContaining({ monthlyIncome: new Decimal('600000') })
    );
  });

  it('throws PROFILE_NOT_FOUND for missing profile', async () => {
    mockProfileRepo.findById.mockResolvedValue(null);

    await expect(
      skill.update({ profileId: 'nonexistent' })
    ).rejects.toMatchObject({ code: PROFILE_NOT_FOUND, httpStatus: 404 });
  });

  it('throws INSUFFICIENT_INCOME_OR_CAPITAL when income=0 AND capital=0 after merge', async () => {
    const profile = makeProfile({
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
    });

    mockProfileRepo.findById.mockResolvedValue(profile);

    await expect(
      skill.update({
        profileId: 'profile-1',
        monthlyIncome: new Decimal('0'),
        availableCapital: new Decimal('0'),
      })
    ).rejects.toMatchObject({ code: INSUFFICIENT_INCOME_OR_CAPITAL, httpStatus: 422 });
  });

  it('throws INVALID_MONTHLY_ALLOCATION when allocation > capital (income=0)', async () => {
    const profile = makeProfile({
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('100000'),
      monthlyAllocation: new Decimal('0'),
    });

    mockProfileRepo.findById.mockResolvedValue(profile);

    await expect(
      skill.update({
        profileId: 'profile-1',
        monthlyAllocation: new Decimal('200000'),
      })
    ).rejects.toMatchObject({ code: INVALID_MONTHLY_ALLOCATION, httpStatus: 422 });
  });

  it('accepts finiquito scenario: income=0, capital>0, allocation<=capital', async () => {
    const profile = makeProfile({
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('0'),
      monthlyAllocation: new Decimal('0'),
    });
    const updated = makeProfile({
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('5000000'),
      monthlyAllocation: new Decimal('200000'),
    });

    mockProfileRepo.findById.mockResolvedValue(profile);
    mockProfileRepo.update.mockResolvedValue(updated);

    const result = await skill.update({
      profileId: 'profile-1',
      monthlyIncome: new Decimal('0'),
      availableCapital: new Decimal('5000000'),
      monthlyAllocation: new Decimal('200000'),
    });

    expect(result).toEqual(updated);
    expect(mockProfileRepo.update).toHaveBeenCalled();
  });
});
