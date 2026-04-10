import { prisma } from './config/prisma';
import { getSupabaseAdmin } from './config/supabase';
import { PrismaUserProfileRepository } from './repositories/prisma/user-profile.prisma-repository';
import { PrismaFinancialSpaceRepository } from './repositories/prisma/financial-space.prisma-repository';
import { PrismaFinancialSpaceMemberRepository } from './repositories/prisma/financial-space-member.prisma-repository';
import { PrismaInvitationRepository } from './repositories/prisma/invitation.prisma-repository';
import { PrismaDebtRepository } from './repositories/prisma/debt.prisma-repository';
import { createSpaceResolver } from './shared/middleware/space-resolver.middleware';

// Skills
import { FinancialSpaceCreatorSkill } from './skills/financial-space-creator.skill';
import { MemberCreatorSkill } from './skills/member-creator.skill';
import { UserRegistrationSkill } from './skills/user-registration.skill';
import { ProfileResolverSkill } from './skills/profile-resolver.skill';
import { InvitationCreatorSkill } from './skills/invitation-creator.skill';
import { InvitationValidatorSkill } from './skills/invitation-validator.skill';
import { InvitationAcceptorSkill } from './skills/invitation-acceptor.skill';
import { UpdateFinancialProfileSkill } from './skills/update-financial-profile.skill';
import { GetAvailableBudgetSkill } from './skills/get-available-budget.skill';
import { DebtCreatorSkill } from './skills/debt-creator.skill';
import { DebtUpdaterSkill } from './skills/debt-updater.skill';
import { DebtArchiverSkill } from './skills/debt-archiver.skill';
import { DebtSharingTogglerSkill } from './skills/debt-sharing-toggler.skill';
import { CriticalDebtDetectorSkill } from './skills/critical-debt-detector.skill';

// Managers
import { AuthManager } from './managers/auth.manager';
import { InvitationManager } from './managers/invitation.manager';
import { FinancialSpaceManager } from './managers/financial-space.manager';
import { ProfileManager } from './managers/profile.manager';
import { DebtManager } from './managers/debt.manager';

// Repositories
export const userProfileRepo = new PrismaUserProfileRepository(prisma);
export const financialSpaceRepo = new PrismaFinancialSpaceRepository(prisma);
export const memberRepo = new PrismaFinancialSpaceMemberRepository(prisma);
export const invitationRepo = new PrismaInvitationRepository(prisma);
export const debtRepo = new PrismaDebtRepository(prisma);

// Middleware factories
export const spaceResolver = createSpaceResolver(userProfileRepo, memberRepo);

// Skills
export const financialSpaceCreatorSkill = new FinancialSpaceCreatorSkill(financialSpaceRepo);
export const memberCreatorSkill = new MemberCreatorSkill(memberRepo);
export const userRegistrationSkill = new UserRegistrationSkill(
  prisma,
  userProfileRepo,
  financialSpaceRepo,
  memberRepo
);
export const profileResolverSkill = new ProfileResolverSkill(
  userProfileRepo,
  financialSpaceRepo,
  memberRepo
);
export const invitationCreatorSkill = new InvitationCreatorSkill(invitationRepo);
export const invitationValidatorSkill = new InvitationValidatorSkill(invitationRepo);
export const invitationAcceptorSkill = new InvitationAcceptorSkill(
  prisma,
  invitationRepo,
  memberRepo
);

// M2 skills — pure (no repo)
export const getAvailableBudgetSkill = new GetAvailableBudgetSkill();
export const criticalDebtDetectorSkill = new CriticalDebtDetectorSkill();

// M2 skills — repo-based
export const updateFinancialProfileSkill = new UpdateFinancialProfileSkill(userProfileRepo);
export const debtCreatorSkill = new DebtCreatorSkill(debtRepo);
export const debtUpdaterSkill = new DebtUpdaterSkill(debtRepo);
export const debtArchiverSkill = new DebtArchiverSkill(debtRepo);
export const debtSharingTogglerSkill = new DebtSharingTogglerSkill(debtRepo);

// Managers
export const authManager = new AuthManager(
  getSupabaseAdmin(),
  userRegistrationSkill,
  profileResolverSkill
);
export const invitationManager = new InvitationManager(
  invitationCreatorSkill,
  invitationValidatorSkill,
  invitationAcceptorSkill,
  invitationRepo
);
export const financialSpaceManager = new FinancialSpaceManager(
  financialSpaceRepo,
  memberRepo
);
export const profileManager = new ProfileManager(
  updateFinancialProfileSkill,
  getAvailableBudgetSkill,
  userProfileRepo,
  debtRepo
);
export const debtManager = new DebtManager(
  debtCreatorSkill,
  debtUpdaterSkill,
  debtArchiverSkill,
  debtSharingTogglerSkill,
  criticalDebtDetectorSkill,
  debtRepo
);
