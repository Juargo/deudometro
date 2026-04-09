import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvitationAcceptorSkill } from '../../../src/skills/invitation-acceptor.skill';
import { makeInvitation, makeMember } from './helpers';

const mockInvitationRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  findAllBySpace: vi.fn(),
  updateStatus: vi.fn(),
};

const mockMemberRepo = {
  create: vi.fn(),
  findBySpaceAndUser: vi.fn(),
  findAllBySpace: vi.fn(),
};

const mockPrisma = {
  $transaction: vi.fn((cb: (tx: unknown) => Promise<unknown>) => cb({})),
} as unknown as import('@prisma/client').PrismaClient;

describe('InvitationAcceptorSkill', () => {
  let skill: InvitationAcceptorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new InvitationAcceptorSkill(mockPrisma, mockInvitationRepo, mockMemberRepo);
  });

  it('marks invitation as accepted and creates editor member in a transaction', async () => {
    const invitation = makeInvitation({ status: 'accepted' });
    const member = makeMember({ role: 'editor', userId: 'user-2' });

    mockInvitationRepo.updateStatus.mockResolvedValue(invitation);
    mockMemberRepo.create.mockResolvedValue(member);

    const result = await skill.accept({
      invitationId: 'inv-1',
      acceptingUserId: 'user-2',
      financialSpaceId: 'space-1',
    });

    expect(result.invitation.status).toBe('accepted');
    expect(result.member.role).toBe('editor');
    expect(result.member.userId).toBe('user-2');
    expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
  });

  it('passes accepted status to updateStatus', async () => {
    mockInvitationRepo.updateStatus.mockResolvedValue(makeInvitation({ status: 'accepted' }));
    mockMemberRepo.create.mockResolvedValue(makeMember({ role: 'editor' }));

    await skill.accept({
      invitationId: 'inv-1',
      acceptingUserId: 'user-2',
      financialSpaceId: 'space-1',
    });

    expect(mockInvitationRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'accepted', expect.anything());
  });

  it('creates member with editor role', async () => {
    mockInvitationRepo.updateStatus.mockResolvedValue(makeInvitation({ status: 'accepted' }));
    mockMemberRepo.create.mockResolvedValue(makeMember({ role: 'editor' }));

    await skill.accept({
      invitationId: 'inv-1',
      acceptingUserId: 'user-2',
      financialSpaceId: 'space-1',
    });

    expect(mockMemberRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'editor', userId: 'user-2', financialSpaceId: 'space-1' }),
      expect.anything()
    );
  });
});
