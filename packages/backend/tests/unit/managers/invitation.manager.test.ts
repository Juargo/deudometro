import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvitationManager } from '../../../src/managers/invitation.manager';
import { DomainError, FORBIDDEN } from '../../../src/shared/errors';
import type { RequestContext } from '../../../src/shared/types';
import { makeInvitation, makeMember } from '../skills/helpers';

const mockCreatorSkill = { create: vi.fn() };
const mockValidatorSkill = { validate: vi.fn() };
const mockAcceptorSkill = { accept: vi.fn() };
const mockInvitationRepo = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  findAllBySpace: vi.fn(),
  updateStatus: vi.fn(),
};

const ownerContext: RequestContext = {
  userId: 'user-1',
  email: 'owner@example.com',
  profileId: 'profile-1',
  financialSpaceId: 'space-1',
  role: 'owner',
};

const editorContext: RequestContext = {
  ...ownerContext,
  userId: 'user-2',
  role: 'editor',
};

describe('InvitationManager', () => {
  let manager: InvitationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new InvitationManager(
      mockCreatorSkill as any,
      mockValidatorSkill as any,
      mockAcceptorSkill as any,
      mockInvitationRepo as any
    );
  });

  describe('createInvitation', () => {
    it('creates invitation when called by owner', async () => {
      const invitation = makeInvitation();
      mockCreatorSkill.create.mockResolvedValue({ invitation, rawToken: 'tok' });

      const result = await manager.createInvitation(ownerContext, 'invited@example.com');

      expect(result.rawToken).toBe('tok');
      expect(mockCreatorSkill.create).toHaveBeenCalledWith({
        spaceId: 'space-1',
        email: 'invited@example.com',
        invitedByUserId: 'user-1',
      });
    });

    it('throws FORBIDDEN when called by editor', async () => {
      await expect(
        manager.createInvitation(editorContext, 'invited@example.com')
      ).rejects.toMatchObject({ code: FORBIDDEN, httpStatus: 403 });
    });
  });

  describe('listInvitations', () => {
    it('returns pending invitations for owner', async () => {
      const invitations = [makeInvitation()];
      mockInvitationRepo.findAllBySpace.mockResolvedValue(invitations);

      const result = await manager.listInvitations(ownerContext);

      expect(result).toEqual(invitations);
      expect(mockInvitationRepo.findAllBySpace).toHaveBeenCalledWith('space-1', 'pending');
    });

    it('throws FORBIDDEN for editor', async () => {
      await expect(manager.listInvitations(editorContext)).rejects.toMatchObject({
        code: FORBIDDEN,
        httpStatus: 403,
      });
    });
  });

  describe('revokeInvitation', () => {
    it('revokes invitation as owner', async () => {
      mockInvitationRepo.updateStatus.mockResolvedValue(undefined);

      await manager.revokeInvitation(ownerContext, 'inv-1');

      expect(mockInvitationRepo.updateStatus).toHaveBeenCalledWith('inv-1', 'revoked');
    });

    it('throws FORBIDDEN for editor', async () => {
      await expect(manager.revokeInvitation(editorContext, 'inv-1')).rejects.toMatchObject({
        code: FORBIDDEN,
      });
    });
  });

  describe('acceptInvitation', () => {
    it('validates token then accepts invitation', async () => {
      const invitation = makeInvitation({ id: 'inv-1', financialSpaceId: 'space-2' });
      const member = makeMember({ role: 'editor', userId: 'user-2' });

      mockValidatorSkill.validate.mockResolvedValue(invitation);
      mockAcceptorSkill.accept.mockResolvedValue({ invitation, member });

      const result = await manager.acceptInvitation(editorContext, 'raw-token');

      expect(result.role).toBe('editor');
      expect(mockValidatorSkill.validate).toHaveBeenCalledWith('raw-token');
      expect(mockAcceptorSkill.accept).toHaveBeenCalledWith({
        invitationId: 'inv-1',
        acceptingUserId: 'user-2',
        financialSpaceId: 'space-2',
      });
    });
  });
});
