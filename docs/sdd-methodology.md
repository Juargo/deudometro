# SDD Methodology — Deudometro

**Versión:** 0.1.0
**Fecha:** 2026-03-23

Este documento describe el proceso de **Specification-Driven Development (SDD)** aplicado al proyecto Deudometro. Define cómo se construye cada etapa, qué produce, y los formatos estándar de cada artefacto.

---

## Principios del SDD

1. **La spec es el contrato** — si el código se desvía de la spec, se corrige el código, no la spec (salvo error en la spec).
2. **Un skill sin spec no existe** — comportamiento en código que no está en una spec es un bug potencial.
3. **El dominio primero** — las entidades del dominio se definen antes de cualquier línea de código.
4. **Declarativo > Procedimental** — las reglas de negocio se escriben como afirmaciones verificables, no como flujos de código.

---

## Etapa 2 — Modelado del dominio

**Qué se hace:** se identifican las entidades del mundo real que el sistema debe representar, sus atributos y las relaciones entre ellas. Este es el vocabulario compartido del proyecto — todos los artefactos futuros hablan en términos de este modelo.

**En Deudometro:** las entidades principales son `UserProfile`, `Debt`, `DebtPlan`, `PlanAction`, `Payment` y `Milestone`. Se analiza cada tipo de deuda y sus atributos específicos. Se decide la estrategia de `metadata` JSON para manejar atributos variables por tipo de deuda.

**Artefacto:** `docs/domain-model.md` — diagrama ERD + descripción de cada entidad, sus campos, tipos y reglas de integridad.

---

## Etapa 3 — Definición de reglas de negocio

**Qué se hace:** se escriben explícitamente las reglas que gobiernan el comportamiento del sistema. No son reglas de código — son reglas del dominio. Deben ser declarativas, verificables y sin ambigüedad.

**Ejemplos en Deudometro:**
- Si el pago mínimo no cubre los intereses generados, la deuda es crítica.
- Si `lenderType` es `informal_lender`, esa deuda va primera en el plan sin excepción.
- `availableBudget` se calcula en tiempo de ejecución y nunca se persiste.

**Artefacto:** `docs/business-rules.md` — lista numerada de reglas, cada una con nombre, condición, consecuencia y ejemplo concreto.

---

## Etapa 4 — Mapa de funcionalidades

**Qué se hace:** se definen las funcionalidades de alto nivel organizadas por módulo. No es un backlog — es una visión de qué puede hacer el sistema. Se prioriza por valor para el usuario vs. complejidad de implementación.

**Flujo en Deudometro:** ingreso de deudas → ingreso de ingresos disponibles → selección de estrategia → generación de plan → seguimiento de pagos → detección de milestones → notificaciones de progreso.

**Prioridades:**
- **P0 (esencial):** registro de deudas, dashboard de resumen, simulador de estrategias
- **P1 (importante):** seguimiento de pagos, detección de milestones, alertas de vencimiento
- **P2 (deseable):** exportar PDF, historial de planes, comparativa de estrategias

**Artefacto:** `docs/feature-map.md` — árbol de funcionalidades con prioridad P0/P1/P2 y dependencias entre ellas.

---

## Etapa 5 — Diseño de arquitectura

**Qué se hace:** se decide cómo se organiza el sistema en capas, módulos y componentes. Se definen los patrones centrales del SDD: **Router → Managers → Skills**. Se toman las decisiones técnicas fundamentales con su justificación.

**En Deudometro:** stack = Nuxt 3 + Vue 3 + Tailwind (frontend) · Express.js REST (backend) · Prisma + PostgreSQL via Supabase · Vercel (deploy). Los managers son `DebtManager`, `AnalysisManager`, `PlanManager` y `ProgressManager`.

**Artefacto:** `docs/architecture.md` + diagrama de componentes. Incluye cada decisión técnica y el razonamiento detrás de ella.

---

## Etapa 6 — Specs de Skills

**Qué es un skill:** la unidad más pequeña de comportamiento del sistema. Hace una sola cosa. No tiene efectos secundarios fuera de su responsabilidad declarada.

**Formato estándar de spec de skill:**

```markdown
# SKILL: <nombre>

## Propósito
<Una oración que describe qué hace exactamente este skill.>

## Input
```typescript
{
  campo: Tipo
}
```

## Output
```typescript
{
  success: true
  resultado: TipoResultado
} | {
  success: false
  errors: ErrorType[]
}
```

## Reglas
1. <Regla declarativa verificable>
2. <Regla declarativa verificable>

## Errores
- ERROR_CODE: descripción de cuándo ocurre

## Dependencias
- Repositorio o servicio externo que invoca
```

**Skills principales en Deudometro:** `debt-entry`, `debt-validation`, `analysis-calculator`, `snowball-sorter`, `avalanche-sorter`, `hybrid-sorter`, `prompt-builder`, `ai-plan-generator`, `milestone-detector`, `payment-recorder`.

**Artefacto:** un archivo `SKILL-<nombre>.md` por cada skill, dentro de `specs/skills/`.

---

## Etapa 7 — Specs de Managers

**Qué es un Manager:** orquesta varios skills para completar un caso de uso completo. No tiene lógica propia — delega en sus skills. Define el orden de ejecución, el manejo de errores intermedios y qué devuelve al Router.

**Formato estándar de spec de Manager:**

```markdown
# MANAGER: <NombreManager>

## Propósito
<Caso de uso completo que este manager resuelve.>

## Input
```typescript
{ ... }
```

## Output
```typescript
{ ... }
```

## Flujo de orquestación
1. <Paso 1 — skill o repositorio que invoca>
2. <Paso 2>
3. Si <condición> → retornar error <ERROR_CODE> sin continuar
...

## Errores
- ERROR_CODE: descripción
```

**Ejemplo de flujo — `AnalysisManager`:**
1. Cargar `UserProfile` y `Debt[]` activas via `DebtRepository`
2. Ejecutar `[debt-validation skill]` sobre cada deuda
3. Detectar deudas críticas (Regla de Negocio #3)
4. Elevar `informal_lender` si existe (Regla de Negocio #4)
5. Ejecutar skill de ordenamiento según estrategia (`avalanche-sorter` / `snowball-sorter` / `hybrid-sorter`)
6. Ejecutar `analysis-calculator` para generar `PlanActions`
7. Si `availableBudget < totalMinimumPayments` → retornar `INSUFFICIENT_BUDGET`
8. Ejecutar `prompt-builder` + `ai-plan-generator`
9. Persistir `DebtPlan` y `PlanActions` via `PlanRepository`
10. Retornar plan completo

**Artefacto:** un archivo `MANAGER-<nombre>.md` por cada manager, dentro de `specs/managers/`.

---

## Etapa 8 — Spec del Router

**Qué es el Router:** el punto de entrada del sistema. Recibe el intent del usuario, lo valida y lo delega al manager correspondiente. No tiene lógica de negocio.

**Formato estándar:**

```markdown
# ROUTER: DeudometroRouter

## Intents disponibles

| Intent                | Condición de activación         | Manager destino   |
|-----------------------|---------------------------------|-------------------|
| REGISTER_DEBT         | usuario envía formulario deuda  | DebtManager       |
| UPDATE_DEBT           | usuario edita deuda existente   | DebtManager       |
| GENERATE_PLAN         | usuario solicita generar plan   | AnalysisManager   |
| RECORD_PAYMENT        | usuario registra un pago        | ProgressManager   |
| GET_PROGRESS          | usuario consulta su progreso    | ProgressManager   |
| ACKNOWLEDGE_MILESTONE | usuario descarta un milestone   | ProgressManager   |

## Reglas del Router
1. Todo intent requiere `userId` autenticado — si no existe, retornar `AUTH_REQUIRED` antes de rutear.
2. `GENERATE_PLAN` requiere al menos 1 deuda activa — si no, retornar `NO_DEBTS_TO_PLAN` sin llamar al manager.
3. Intents desconocidos retornan `UNKNOWN_INTENT` con lista de intents válidos.
```

**Artefacto:** `specs/ROUTER.md`.

---

## Etapa 9 — Setup del proyecto

**Qué se hace:** inicializar el repositorio con la estructura de carpetas definida en `architecture.md`, configurar herramientas (ESLint, TypeScript, variables de entorno), generar `schema.prisma` directamente desde `domain-model.md` y aplicar la primera migración.

**Estructura de carpetas objetivo:**

```
/
├── docs/                    # Artefactos de arquitectura y decisiones
├── specs/
│   ├── skills/              # SKILL-*.md
│   ├── managers/            # MANAGER-*.md
│   └── ROUTER.md
├── frontend/                # App Nuxt 3
│   ├── components/
│   ├── pages/
│   ├── composables/
│   └── nuxt.config.ts
├── backend/                 # API Express.js
│   ├── src/
│   │   ├── router/
│   │   ├── managers/
│   │   ├── skills/
│   │   └── repositories/
│   └── prisma/
│       └── schema.prisma
└── .env.example
```

**Artefacto:** repositorio funcional con `schema.prisma` generado y primera migración aplicada.

---

## Etapa 10 — Implementación de Skills

**Qué se hace:** implementar cada skill siguiendo su spec como contrato. El orden sigue las dependencias — primero los skills sin dependencias, luego los que dependen de ellos.

**Regla clave:** la spec es la fuente de verdad. Si el código se desvía, se corrige el código. Si la spec tiene un error, se corrige la spec y se versiona el cambio.

**Artefacto:** archivos de implementación en `backend/src/skills/` con tests unitarios que verifican cada regla declarada en la spec.

---

*Documento mantenido en: `docs/sdd-methodology.md`*
