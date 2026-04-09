import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { InvitationCreatorSkill } from '../../../src/skills/invitation-creator.skill';
import { makeInvitation } from './helpers';

const mockInvitationRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  findAllBySpace: vi.fn(),
  updateStatus: vi.fn(),
};

describe('InvitationCreatorSkill', () => {
  let skill: InvitationCreatorSkill;

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new InvitationCreatorSkill(mockInvitationRepo);
  });

  it('creates an invitation with a hashed token', async () => {
    mockInvitationRepo.create.mockImplementation(async (input) => makeInvitation({ tokenHash: input.tokenHash }));

    const result = await skill.create({
      spaceId: 'space-1',
      email: 'invited@example.com',
      invitedByUserId: 'user-1',
    });

    expect(result.rawToken).toBeDefined();
    expect(result.rawToken.length).toBe(64); // 32 bytes hex
    expect(result.invitation.tokenHash).not.toBe(result.rawToken);

    // Verify the stored hash matches SHA-256 of the raw token
    const expectedHash = crypto.createHash('sha256').update(result.rawToken).digest('hex');
    expect(result.invitation.tokenHash).toBe(expectedHash);
  });

  it('sets expiration to ~48 hours from now', async () => {
    const now = Date.now();
    mockInvitationRepo.create.mockImplementation(async (input) =>
      makeInvitation({ expiresAt: input.expiresAt })
    );

    const result = await skill.create({
      spaceId: 'space-1',
      email: 'invited@example.com',
      invitedByUserId: 'user-1',
    });

    const diffHours = (result.invitation.expiresAt.getTime() - now) / (1000 * 60 * 60);
    expect(diffHours).toBeGreaterThan(47.9);
    expect(diffHours).toBeLessThan(48.1);
  });

  it('passes correct data to repository', async () => {
    mockInvitationRepo.create.mockResolvedValue(makeInvitation());

    await skill.create({
      spaceId: 'space-1',
      email: 'invited@example.com',
      invitedByUserId: 'user-1',
    });

    expect(mockInvitationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        financialSpaceId: 'space-1',
        email: 'invited@example.com',
        invitedByUserId: 'user-1',
      })
    );
  });
});
