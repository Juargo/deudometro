# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Deudometro** es una aplicación web para que personas con deudas personales puedan registrar, visualizar y planificar el pago de todas sus deudas en un solo lugar. Incluye simulador de estrategias (Avalanche/Snowball) y alertas de pago.

Ver `docs/problem-statement.md` para el alcance completo y criterios de éxito.

## Stack

| Capa           | Tecnología                        |
|----------------|-----------------------------------|
| Frontend       | Nuxt 3 + Vue 3 + Tailwind CSS     |
| Backend / API  | Express.js (REST API)             |
| ORM            | Prisma                            |
| Base de datos  | PostgreSQL via Supabase           |
| Auth + Storage | Supabase                          |
| Deploy         | Vercel (frontend)                 |

## Git Workflow — GitHub Flow

- `main` es la rama de producción, siempre estable
- Todo desarrollo en feature branches: `feature/<descripcion>`, `fix/<descripcion>`, `docs/<descripcion>`
- Abrir PR hacia `main`, revisión requerida antes de merge
- No push directo a `main`

## Estructura del proyecto (planeada)

```
/
├── docs/               # Artefactos de arquitectura y decisiones
├── frontend/           # App Nuxt 3
└── backend/            # API Express.js
```

## Commands (se actualizará con el scaffolding)

- Dev frontend: `cd frontend && npm run dev`
- Dev backend: `cd backend && npm run dev`
- DB migrations: `npx prisma migrate dev`
