import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { InvitationValidatorSkill } from '../../../src/skills/invitation-validator.skill';
import { DomainError, INVITATION_NOT_FOUND, INVITATION_EXPIRED, INVITATION_USED } from '../../../src/shared/errors';
import { makeInvitation } from './helpers';

const mockInvitationRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  findAllBySpace: vi.fn(),
  updateStatus: vi.fn(),
};

describe('InvitationValidatorSkill', () => {
  let skill: InvitationValidatorSkill;
  const rawToken = 'a'.repeat(64);
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  beforeEach(() => {
    vi.clearAllMocks();
    skill = new InvitationValidatorSkill(mockInvitationRepo);
  });

  it('returns invitation for a valid pending token', async () => {
    const invitation = makeInvitation({ tokenHash, status: 'pending' });
    mockInvitationRepo.findByTokenHash.mockResolvedValue(invitation);

    const result = await skill.validate(rawToken);
    expect(result).toEqual(invitation);
    expect(mockInvitationRepo.findByTokenHash).toHaveBeenCalledWith(tokenHash);
  });

  it('throws INVITATION_NOT_FOUND for unknown token', async () => {
    mockInvitationRepo.findByTokenHash.mockResolvedValue(null);

    await expect(skill.validate('unknown-token')).rejects.toMatchObject({
      code: INVITATION_NOT_FOUND,
      httpStatus: 404,
    });
  });

  it('throws INVITATION_EXPIRED for expired token', async () => {
    const expired = makeInvitation({
      tokenHash,
      status: 'pending',
      expiresAt: new Date(Date.now() - 1000),
    });
    mockInvitationRepo.findByTokenHash.mockResolvedValue(expired);

    await expect(skill.validate(rawToken)).rejects.toMatchObject({
      code: INVITATION_EXPIRED,
      httpStatus: 410,
    });
  });

  it('throws INVITATION_USED for accepted invitation', async () => {
    const used = makeInvitation({ tokenHash, status: 'accepted' });
    mockInvitationRepo.findByTokenHash.mockResolvedValue(used);

    await expect(skill.validate(rawToken)).rejects.toMatchObject({
      code: INVITATION_USED,
      httpStatus: 409,
    });
  });

  it('throws INVITATION_USED for revoked invitation', async () => {
    const revoked = makeInvitation({ tokenHash, status: 'revoked' });
    mockInvitationRepo.findByTokenHash.mockResolvedValue(revoked);

    await expect(skill.validate(rawToken)).rejects.toMatchObject({
      code: INVITATION_USED,
      httpStatus: 409,
    });
  });
});
