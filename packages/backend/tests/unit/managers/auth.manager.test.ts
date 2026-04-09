import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from '../../../src/managers/auth.manager';
import { DomainError, INVALID_CREDENTIALS, EMAIL_ALREADY_REGISTERED, REGISTRATION_FAILED } from '../../../src/shared/errors';
import { makeProfile, makeSpace, makeMember } from '../skills/helpers';

const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    admin: { deleteUser: vi.fn(), signOut: vi.fn(), updateUserById: vi.fn() },
    resetPasswordForEmail: vi.fn(),
  },
} as any;

const mockRegistrationSkill = { register: vi.fn() };
const mockProfileResolver = { resolve: vi.fn() };

describe('AuthManager', () => {
  let manager: AuthManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new AuthManager(mockSupabase, mockRegistrationSkill as any, mockProfileResolver as any);
  });

  describe('register', () => {
    it('creates supabase user then calls registration skill', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'sb-1' } }, error: null });
      const regResult = { profile: makeProfile(), financialSpace: makeSpace(), member: makeMember() };
      mockRegistrationSkill.register.mockResolvedValue(regResult);

      const result = await manager.register('test@example.com', 'pass123', 'Test');

      expect(result).toEqual(regResult);
      expect(mockRegistrationSkill.register).toHaveBeenCalledWith({
        supabaseUserId: 'sb-1',
        email: 'test@example.com',
        displayName: 'Test',
      });
    });

    it('throws EMAIL_ALREADY_REGISTERED if supabase says already registered', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(manager.register('x@x.com', 'p', 'N')).rejects.toMatchObject({
        code: EMAIL_ALREADY_REGISTERED,
        httpStatus: 409,
      });
    });

    it('rolls back supabase user if skill registration fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: { user: { id: 'sb-2' } }, error: null });
      mockRegistrationSkill.register.mockRejectedValue(new Error('DB error'));

      await expect(manager.register('x@x.com', 'p', 'N')).rejects.toThrow('DB error');
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('sb-2');
    });

    it('throws REGISTRATION_FAILED if no user ID returned', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ data: { user: null }, error: null });

      await expect(manager.register('x@x.com', 'p', 'N')).rejects.toMatchObject({
        code: REGISTRATION_FAILED,
        httpStatus: 500,
      });
    });
  });

  describe('login', () => {
    it('returns token and profile on success', async () => {
      const resolvedProfile = { profile: makeProfile(), financialSpace: makeSpace(), role: 'owner' as const };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'sb-1' }, session: { access_token: 'jwt-token' } },
        error: null,
      });
      mockProfileResolver.resolve.mockResolvedValue(resolvedProfile);

      const result = await manager.login('test@example.com', 'pass123');

      expect(result.token).toBe('jwt-token');
      expect(result.profile).toEqual(resolvedProfile);
    });

    it('throws INVALID_CREDENTIALS on wrong password', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login' },
      });

      await expect(manager.login('x@x.com', 'wrong')).rejects.toMatchObject({
        code: INVALID_CREDENTIALS,
        httpStatus: 401,
      });
    });
  });
});
