import type { UserProfile, PrismaClient } from '@prisma/client'

export interface CreateUserData {
  authUserId: string
  displayName: string
  monthlyIncome: number
  fixedExpenses: {
    rent: number
    utilities: number
    food: number
    transport: number
    other: number
  }
  currency?: string
}

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<UserProfile> {
    return this.prisma.userProfile.create({
      data: {
        authUserId: data.authUserId,
        displayName: data.displayName,
        currency: data.currency ?? 'CLP',
        monthlyIncome: data.monthlyIncome,
        fixedExpenses: data.fixedExpenses,
      },
    })
  }

  async getByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    return this.prisma.userProfile.findUnique({ where: { authUserId } })
  }

  async update(authUserId: string, data: Partial<Omit<CreateUserData, 'authUserId'>>): Promise<UserProfile> {
    return this.prisma.userProfile.update({
      where: { authUserId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.monthlyIncome !== undefined && { monthlyIncome: data.monthlyIncome }),
        ...(data.fixedExpenses !== undefined && { fixedExpenses: data.fixedExpenses }),
      },
    })
  }
}
