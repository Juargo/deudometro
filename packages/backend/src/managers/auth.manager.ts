import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserRegistrationSkill, RegisterResult } from '../skills/user-registration.skill';
import type { ProfileResolverSkill, ResolveProfileResult } from '../skills/profile-resolver.skill';
import { DomainError, INVALID_CREDENTIALS, EMAIL_ALREADY_REGISTERED, REGISTRATION_FAILED } from '../shared/errors';
import { logger } from '../config/logger';

export class AuthManager {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userRegistrationSkill: UserRegistrationSkill,
    private readonly profileResolverSkill: ProfileResolverSkill
  ) {}

  async register(email: string, password: string, displayName: string): Promise<RegisterResult> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message?.includes('already registered')) {
        throw new DomainError(EMAIL_ALREADY_REGISTERED, 409, 'Email already registered');
      }
      throw new DomainError(REGISTRATION_FAILED, 500, error.message);
    }

    const supabaseUserId = data.user?.id;
    if (!supabaseUserId) {
      throw new DomainError(REGISTRATION_FAILED, 500, 'Supabase did not return a user ID');
    }

    try {
      const result = await this.userRegistrationSkill.register({
        supabaseUserId,
        email,
        displayName,
      });
      logger.info({ userId: supabaseUserId, operation: 'auth.register' }, 'User registered');
      return result;
    } catch (err) {
      await this.supabase.auth.admin.deleteUser(supabaseUserId);
      throw err;
    }
  }

  async login(email: string, password: string): Promise<{ token: string; profile: ResolveProfileResult }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new DomainError(INVALID_CREDENTIALS, 401, 'Invalid email or password');
    }

    const profile = await this.profileResolverSkill.resolve(data.user.id);
    logger.info({ userId: data.user.id, operation: 'auth.login' }, 'User logged in');

    return { token: data.session.access_token, profile };
  }

  async logout(token: string): Promise<void> {
    await this.supabase.auth.admin.signOut(token);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.supabase.auth.resetPasswordForEmail(email);
  }

  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.updateUserById(accessToken, {
      password: newPassword,
    });
    if (error) {
      throw new DomainError(INVALID_CREDENTIALS, 401, error.message);
    }
  }
}
