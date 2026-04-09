import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemberCreatorSkill } from '../../../src/skills/member-creator.skill';
import { DomainError, MEMBER_ALREADY_EXISTS } from '../../../src/shared/errors';
import { makeMember } from './helpers';

const mockMemberRepo = {
  create: vi.fn(),
  findBySpaceAndUser: vi.fn(),
  findAllBySpace: vi.fn(),
};

describe('MemberCreatorSkill', () => {
  let skill: MemberCreatorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new MemberCreatorSkill(mockMemberRepo);
  });

  it('creates a member when none exists', async () => {
    const member = makeMember({ role: 'editor', userId: 'user-2' });
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(null);
    mockMemberRepo.create.mockResolvedValue(member);

    const result = await skill.create({
      userId: 'user-2',
      spaceId: 'space-1',
      role: 'editor',
    });

    expect(result.role).toBe('editor');
    expect(result.userId).toBe('user-2');
    expect(mockMemberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ financialSpaceId: 'space-1', userId: 'user-2', role: 'editor' }),
      undefined
    );
  });

  it('throws MEMBER_ALREADY_EXISTS if member is already in space', async () => {
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(makeMember());

    await expect(
      skill.create({ userId: 'user-1', spaceId: 'space-1', role: 'editor' })
    ).rejects.toThrow(DomainError);

    await expect(
      skill.create({ userId: 'user-1', spaceId: 'space-1', role: 'editor' })
    ).rejects.toMatchObject({
      code: MEMBER_ALREADY_EXISTS,
      httpStatus: 409,
    });
  });

  it('passes transaction context to repository calls', async () => {
    const tx = {} as unknown;
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(null);
    mockMemberRepo.create.mockResolvedValue(makeMember({ role: 'editor' }));

    await skill.create({ userId: 'user-2', spaceId: 'space-1', role: 'editor' }, tx);

    expect(mockMemberRepo.findBySpaceAndUser).toHaveBeenCalledWith('space-1', 'user-2', tx);
    expect(mockMemberRepo.create).toHaveBeenCalledWith(expect.anything(), tx);
  });

  it('passes invitedByUserId when provided', async () => {
    mockMemberRepo.findBySpaceAndUser.mockResolvedValue(null);
    mockMemberRepo.create.mockResolvedValue(makeMember({ role: 'editor' }));

    await skill.create({
      userId: 'user-2',
      spaceId: 'space-1',
      role: 'editor',
      invitedByUserId: 'user-1',
    });

    expect(mockMemberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ invitedByUserId: 'user-1' }),
      undefined
    );
  });
});
