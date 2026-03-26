# Skill Registry — Deudometro

Generated: 2026-03-26

## Project Skills

| Skill | Trigger | Path |
|-------|---------|------|
| backend-architecture | Backend code in `backend/src/` — routes, managers, skills, repositories | `.claude/skills/backend-architecture/SKILL.md` |
| claude-api | Code imports `anthropic`/`@anthropic-ai/sdk`/`claude_agent_sdk` | `.claude/skills/claude-api/SKILL.md` |
| deploy-to-vercel | Deploy requests — "deploy my app", "push this live" | `.claude/skills/deploy-to-vercel/SKILL.md` |
| frontend-design | Build web components, pages, dashboards, UI styling | `.claude/skills/frontend-design/SKILL.md` |
| webapp-testing | Test local web apps, verify frontend, capture screenshots | `.claude/skills/webapp-testing/SKILL.md` |
| web-design-guidelines | "review my UI", "check accessibility", "audit design" | `.claude/skills/web-design-guidelines/SKILL.md` |

## User Skills

(none detected — no user-level SKILL.md files found outside sdd-*/skill-registry/_shared)

## Project Conventions

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project instructions — SDD pattern, stack, commands, env vars |

## Compact Rules

### backend-architecture
- Pattern: Router → Managers → Skills → Repositories (never skip layers)
- Router: validate auth + input, delegate to manager. No business logic.
- Manager: orchestrate use case by calling skills in order.
- Skill: single responsibility, must have spec in `specs/skills/SKILL-<name>.md`.
- Repository: sole Prisma access point. No business logic.

### claude-api
- Default model: `claude-opus-4-6` with adaptive thinking
- Default to streaming for long input/output
- Use SDK helpers like `.get_final_message()` / `.finalMessage()`

### frontend-design
- Commit to a bold aesthetic direction before coding
- Avoid generic "AI slop" aesthetics
- Implement real working code with exceptional attention to detail

### deploy-to-vercel
- Always deploy as preview unless user explicitly asks for production
- Goal: project linked to Vercel with git-push deploys

### webapp-testing
- Use native Python Playwright scripts
- Run helper scripts with `--help` first, don't read source

### web-design-guidelines
- Review files for Web Interface Guidelines compliance
- Covers accessibility, UX patterns, responsive design
