import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialSpaceCreatorSkill } from '../../../src/skills/financial-space-creator.skill';
import { makeSpace } from './helpers';

const mockSpaceRepo = {
  create: vi.fn(),
  findById: vi.fn(),
};

describe('FinancialSpaceCreatorSkill', () => {
  let skill: FinancialSpaceCreatorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new FinancialSpaceCreatorSkill(mockSpaceRepo);
  });

  it('creates a financial space with CLP currency', async () => {
    const space = makeSpace();
    mockSpaceRepo.create.mockResolvedValue(space);

    const result = await skill.create({ name: 'My Space' });

    expect(result).toEqual(space);
    expect(mockSpaceRepo.create).toHaveBeenCalledWith(
      { name: 'My Space', currency: 'CLP' },
      undefined
    );
  });

  it('passes transaction context to repository', async () => {
    const tx = {} as unknown;
    mockSpaceRepo.create.mockResolvedValue(makeSpace());

    await skill.create({ name: 'My Space' }, tx);

    expect(mockSpaceRepo.create).toHaveBeenCalledWith(expect.anything(), tx);
  });
});
