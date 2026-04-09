import { prisma } from './config/prisma';
import { PrismaUserProfileRepository } from './repositories/prisma/user-profile.prisma-repository';
import { PrismaFinancialSpaceRepository } from './repositories/prisma/financial-space.prisma-repository';
import { PrismaFinancialSpaceMemberRepository } from './repositories/prisma/financial-space-member.prisma-repository';
import { PrismaInvitationRepository } from './repositories/prisma/invitation.prisma-repository';
import { createSpaceResolver } from './shared/middleware/space-resolver.middleware';

// Skills
import { FinancialSpaceCreatorSkill } from './skills/financial-space-creator.skill';
import { MemberCreatorSkill } from './skills/member-creator.skill';
import { UserRegistrationSkill } from './skills/user-registration.skill';
import { ProfileResolverSkill } from './skills/profile-resolver.skill';
import { InvitationCreatorSkill } from './skills/invitation-creator.skill';
import { InvitationValidatorSkill } from './skills/invitation-validator.skill';
import { InvitationAcceptorSkill } from './skills/invitation-acceptor.skill';

// Repositories
export const userProfileRepo = new PrismaUserProfileRepository(prisma);
export const financialSpaceRepo = new PrismaFinancialSpaceRepository(prisma);
export const memberRepo = new PrismaFinancialSpaceMemberRepository(prisma);
export const invitationRepo = new PrismaInvitationRepository(prisma);

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
