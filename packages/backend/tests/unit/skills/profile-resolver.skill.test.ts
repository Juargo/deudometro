import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileResolverSkill } from '../../../src/skills/profile-resolver.skill';
import { DomainError, PROFILE_NOT_FOUND } from '../../../src/shared/errors';
import { makeProfile, makeSpace, makeMember } from './helpers';

const mockUserProfileRepo = {
  findBySupabaseUserId: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
};

const mockSpaceRepo = {
  create: vi.fn(),
  findById: vi.fn(),
};

const mockMemberRepo = {
  create: vi.fn(),
  findBySpaceAndUser: vi.fn(),
  findAllBySpace: vi.fn(),
};

describe('ProfileResolverSkill', () => {
  let skill: ProfileResolverSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new ProfileResolverSkill(mockUserProfileRepo, mockSpaceRepo, mockMemberRepo);
  });

  it('returns profile, space, and role for a known user', async () => {
    const profile = makeProfile();
    const space = makeSpace();
    const member = makeMember({ role: 'owner' });

    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(profile);
    mockSpaceRepo.findById.mockResolvedValue(space);
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(member);

    const result = await skill.resolve('user-1');

    expect(result.profile).toEqual(profile);
    expect(result.financialSpace).toEqual(space);
    expect(result.role).toBe('owner');
  });

  it('throws PROFILE_NOT_FOUND for unknown user', async () => {
    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(null);

    await expect(skill.resolve('unknown')).rejects.toThrow(DomainError);
    await expect(skill.resolve('unknown')).rejects.toMatchObject({
      code: PROFILE_NOT_FOUND,
      httpStatus: 404,
    });
  });

  it('throws PROFILE_NOT_FOUND if space does not exist', async () => {
    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(makeProfile());
    mockSpaceRepo.findById.mockResolvedValue(null);

    await expect(skill.resolve('user-1')).rejects.toMatchObject({
      code: PROFILE_NOT_FOUND,
    });
  });

  it('throws PROFILE_NOT_FOUND if member record is missing', async () => {
    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(makeProfile());
    mockSpaceRepo.findById.mockResolvedValue(makeSpace());
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(null);

    await expect(skill.resolve('user-1')).rejects.toMatchObject({
      code: PROFILE_NOT_FOUND,
    });
  });
});
