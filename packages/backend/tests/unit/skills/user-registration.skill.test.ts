import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRegistrationSkill } from '../../../src/skills/user-registration.skill';
import { DomainError, USER_ALREADY_EXISTS } from '../../../src/shared/errors';
import { makeSpace, makeProfile, makeMember } from './helpers';

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

const mockPrisma = {
  $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({})),
} as unknown as import('@prisma/client').PrismaClient;

describe('UserRegistrationSkill', () => {
  let skill: UserRegistrationSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new UserRegistrationSkill(mockPrisma, mockUserProfileRepo, mockSpaceRepo, mockMemberRepo);
  });

  it('creates profile, space, and owner member in a transaction', async () => {
    const space = makeSpace();
    const profile = makeProfile();
    const member = makeMember();

    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(null);
    mockSpaceRepo.create.mockResolvedValue(space);
    mockUserProfileRepo.create.mockResolvedValue(profile);
    mockMemberRepo.create.mockResolvedValue(member);

    const result = await skill.register({
      supabaseUserId: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    });

    expect(result.profile).toEqual(profile);
    expect(result.financialSpace).toEqual(space);
    expect(result.member).toEqual(member);
    expect(mockMemberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'owner' }),
      expect.anything()
    );
  });

  it('throws USER_ALREADY_EXISTS if supabaseUserId is already registered', async () => {
    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(makeProfile());

    await expect(
      skill.register({ supabaseUserId: 'user-1', email: 'test@example.com', displayName: 'Test' })
    ).rejects.toThrow(DomainError);

    await expect(
      skill.register({ supabaseUserId: 'user-1', email: 'test@example.com', displayName: 'Test' })
    ).rejects.toMatchObject({ code: USER_ALREADY_EXISTS, httpStatus: 409 });
  });

  it('wraps the creation in a transaction', async () => {
    mockUserProfileRepo.findBySupabaseUserId.mockResolvedValue(null);
    mockSpaceRepo.create.mockResolvedValue(makeSpace());
    mockUserProfileRepo.create.mockResolvedValue(makeProfile());
    mockMemberRepo.create.mockResolvedValue(makeMember());

    await skill.register({ supabaseUserId: 'user-1', email: 'test@example.com', displayName: 'Test' });

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });
});
