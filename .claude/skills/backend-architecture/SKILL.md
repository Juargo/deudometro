---
name: backend-architecture
description: Enforce the SDD pattern (Router → Managers → Skills → Repositories) for the Deudometro Express backend. Use when writing, reviewing, or refactoring any backend code: API routes, managers, skills, or repositories. Triggers on tasks involving Express handlers, business logic, database access, or any backend file in backend/src/.
---

# Backend Architecture — Deudometro SDD Pattern

## Pattern: Router → Managers → Skills → Repositories

Every backend operation follows this strict hierarchy. Never skip layers.

```
HTTP Request
  └── Router          (validate auth + input, delegate)
        └── Manager   (orchestrate the use case)
              ├── Skills      (atomic units of logic)
              └── Repositories (DB access via Prisma)
```

## Layer Rules

### Router (`backend/src/router/`)
- Validates JWT via `auth.middleware.ts` — `userId` always from `req.userId`, never from body
- Parses and validates request shape (types, required fields)
- Delegates to one Manager method — no business logic here
- Maps Manager errors to correct HTTP status codes:
  - `400` → validation/format error
  - `401` → auth missing/invalid
  - `403` → forbidden (wrong owner)
  - `404` → resource not found
  - `409` → conflict (already exists/acknowledged)
  - `422` → business rule violated
  - `500` → unexpected server error

### Manager (`backend/src/managers/`)
- Orchestrates a complete use case by calling skills in order
- Handles intermediate errors and decides whether to continue or abort
- Never accesses Prisma directly — delegates to Repositories
- Never contains atomic business logic — delegates to Skills
- Returns typed success/failure objects (never throws for business errors)

### Skill (`backend/src/skills/`)
- Does exactly ONE thing
- Pure computation skills have no side effects — they are fully testable without mocks
- Skills with DB access call Repositories, never PrismaClient directly
- Always has a corresponding spec in `specs/skills/SKILL-<name>.md`
- Returns `{ success: true, ... } | { success: false, error: string }` — never throws

### Repository (`backend/src/repositories/`)
- Only layer that imports and uses `PrismaClient`
- No business logic — only data access (CRUD + queries)
- Methods are named semantically: `getByIdAndUserId`, `createWithActions`, `supersedeActivePlan`

## File Naming Conventions

```
backend/src/
├── router/           <entity>.router.ts
├── managers/         <Name>Manager.ts
├── skills/           <kebab-name>.skill.ts
├── repositories/     <Name>Repository.ts
├── ai/               claude.client.ts
├── middleware/        auth.middleware.ts
└── types/            domain.ts
```

## TypeScript Patterns

### Skill return type
```typescript
type SkillResult<T> =
  | { success: true } & T
  | { success: false; error: string; details?: unknown }
```

### Manager method signature
```typescript
async methodName(input: MethodInput): Promise<MethodResult> {
  // 1. Load data via repositories
  // 2. Call skills in sequence
  // 3. Return typed result
}
```

### Repository pattern
```typescript
class DebtRepository {
  constructor(private prisma: PrismaClient) {}

  async getByIdAndUserId(id: string, userId: string): Promise<Debt | null> {
    return this.prisma.debt.findFirst({ where: { id, userId } })
  }
}
```

## Critical Rules

1. **No spec = no skill.** Before implementing a skill, verify its spec exists in `specs/skills/`.
2. **Code deviates from spec → fix the code**, not the spec (unless the spec has an error).
3. **availableBudget is never persisted.** Calculated as `(income - fixedCosts) × (1 - reserve%)`.
4. **userId always from req.userId** (set by auth middleware) — never trust client-supplied userId.
5. **informal_lender always gets priority 1** in any payment plan strategy (BR-07).
6. **isCritical** = `monthlyInterestCost >= minimumPayment`, using monthly rate directly (BR-06).
7. **AI failure is non-blocking** — persist the plan without `aiOutput`, set `aiGenerated: false`.

## Reference Documents

- Entity definitions and types: `docs/domain-model.md`
- Business rules (BR-XX): `docs/business-rules.md`
- Skill specs: `specs/skills/SKILL-*.md`
- Manager specs: `specs/managers/MANAGER-*.md`
- Router spec: `specs/ROUTER.md`
