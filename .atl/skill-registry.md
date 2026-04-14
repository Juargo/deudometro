# Skill Registry — Deudometro

Generated: 2026-04-14
Project: deudometro

## User Skills

| Skill | Trigger | Applies to |
|-------|---------|------------|
| branch-pr | PR creation, opening a PR | Any branch with changes |
| issue-creation | Creating GitHub issues, bug reports, feature requests | GitHub repo |
| judgment-day | "judgment day", "dual review", "juzgar" | Code review, post-implementation |
| context7-mcp | Library/framework questions, API references | Any code using external libs |
| skill-creator | Create new skill, document AI patterns | Skill files |

## Project Skills

None detected on disk.

## Convention Files

| File | Scope |
|------|-------|
| CLAUDE.md | Project root — architecture, commands, conventions |

## Compact Rules

### branch-pr
- Every PR MUST link an approved issue
- Every PR MUST have exactly one `type:*` label
- Automated checks must pass before merge

### issue-creation
- MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically
- A maintainer MUST add `status:approved` before any PR can be opened

### judgment-day
- Launches two independent blind judge sub-agents in parallel
- Synthesizes findings, applies fixes, re-judges until both pass
- Escalates after 2 iterations

### context7-mcp
- Use Context7 MCP to fetch current docs for any library/framework question
- Steps: resolve-library-id → select best match → query-docs → answer with fetched docs

### skill-creator
- Create skills for repeated patterns where AI needs guidance
- Follow SKILL.md frontmatter format with name, description, triggers
- Don't create skills for trivial or one-off tasks

### CLAUDE.md (project conventions)
- pnpm only (no npm/yarn)
- API versioning: all endpoints under `/api/v1/`
- SDD layering: Router -> Manager -> Skill -> Repository
- Monetary fields: Decimal(15,2), default CLP
- New domain ops: skill class in src/skills/, inject repos, wire in container.ts
- All DB access through repository interfaces
- Idempotency key (UUID) required on POST /api/v1/payments
