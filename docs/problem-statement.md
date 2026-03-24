# Problem Statement — Deudometro

**Versión:** 0.1.0
**Fecha:** 2026-03-23
**Estado:** Draft

---

## 1. Contexto

Las personas que manejan múltiples deudas personales (tarjetas de crédito, préstamos personales, créditos automotrices, hipotecas) enfrentan una fragmentación total de la información: cada deuda vive en un banco diferente, con condiciones distintas, tasas de interés variables y fechas de pago dispersas. Esta fragmentación genera estrés financiero, pagos olvidados, y una incapacidad de ver el panorama completo de su situación.

---

## 2. Problema Principal

> **Las personas con deudas personales no tienen una forma simple y visual de entender, rastrear y planificar el pago de todas sus deudas en un solo lugar.**

Las consecuencias directas de este problema son:

- **Visibilidad nula del total real adeudado**: el usuario no sabe cuánto debe en total, cuánto paga en intereses al mes, ni cuándo terminará de pagar.
- **Falta de estrategia de pago**: sin información consolidada, el usuario no puede decidir si conviene atacar la deuda de mayor interés (método Avalanche) o la de menor saldo (método Snowball).
- **Olvidos y pagos tardíos**: con fechas de corte y fechas límite dispersas, se generan cargos por mora que aumentan la deuda.
- **Sensación de pérdida de control**: la opacidad de la situación financiera genera ansiedad y parálisis, lo que lleva a ignorar el problema en lugar de atacarlo.

---

## 3. A quién afecta

**Usuario primario:** Personas adultas con 2 o más deudas personales activas (tarjetas de crédito, créditos de nómina, préstamos personales, BNPL, deudas familiares informales).

**Perfil típico:**
- Edad: 25–45 años
- No necesariamente experto en finanzas personales
- Usa smartphone como herramienta principal
- Tiene deudas con distintos acreedores (bancos, fintech, familiares)
- Quiere salir de deudas pero no sabe por dónde empezar

---

## 4. Lo que existe hoy y por qué no es suficiente

| Solución actual          | Limitación                                                      |
|--------------------------|------------------------------------------------------------------|
| Hojas de cálculo (Excel) | Manual, difícil de mantener, sin alertas ni visualizaciones     |
| Apps de presupuesto (ej. Fintonic, Mint) | Enfocadas en gastos, no en gestión de deuda ni estrategias de pago |
| App del banco            | Solo muestra la deuda de ese banco, sin vista consolidada       |
| Asesor financiero        | Costoso, inaccesible para el segmento medio                     |

---

## 5. Solución propuesta (alto nivel)

**Deudometro** es una aplicación web que permite al usuario:

1. **Registrar todas sus deudas** (saldo, tasa de interés, pago mínimo, fecha de corte/pago)
2. **Visualizar su deuda total** con métricas clave: total adeudado, intereses mensuales, fecha estimada de libertad financiera
3. **Simular estrategias de pago** (Avalanche, Snowball, híbrido) con proyecciones de ahorro
4. **Recibir alertas** de fechas de pago próximas
5. **Ver su progreso** con un indicador visual tipo "deudómetro" que muestra el avance hacia cero deuda

---

## 6. Criterios de éxito (Etapa 1)

- El usuario puede registrar una deuda en menos de 2 minutos
- El usuario ve el total consolidado de su deuda inmediatamente después del registro
- El usuario puede simular al menos dos estrategias de pago (Avalanche y Snowball) con proyecciones claras
- El sistema envía recordatorio antes de la fecha de pago de cada deuda

---

## 7. Fuera de alcance (por ahora)

- Conexión automática con cuentas bancarias (Open Banking / screen scraping)
- Funcionalidades multi-usuario / compartir deudas
- Módulo de presupuesto o control de gastos
- App nativa móvil (iOS / Android)
- Soporte multi-moneda en Etapa 1

---

## 8. Stack Tecnológico Definido

| Capa              | Tecnología                          |
|-------------------|--------------------------------------|
| Package Manager.  | pnpm
| Frontend          | Nuxt 3 + Vue 3 + Tailwind CSS       |
| Backend / API     | Express.js (API REST)               |
| ORM               | Prisma                              |
| Base de datos     | PostgreSQL (via Supabase)           |
| Auth + Storage    | Supabase                            |
| Deploy            | Vercel (frontend) + Supabase (backend DB/auth) |

---

## 9. Próximos pasos

El detalle de la metodología SDD (templates de specs, flujos de orquestación, formatos de artefactos) vive en [`docs/sdd-methodology.md`](./sdd-methodology.md).

| Etapa | Nombre                        | Artefacto que produce                              |
|-------|-------------------------------|----------------------------------------------------|
| 2     | Modelado del dominio          | `docs/domain-model.md` — ERD + entidades + reglas de integridad ✅ |
| 3     | Reglas de negocio             | `docs/business-rules.md` — lista numerada, declarativa y verificable ✅ |
| 4     | Mapa de funcionalidades       | `docs/feature-map.md` — árbol de features con prioridad P0/P1/P2 |
| 5     | Diseño de arquitectura        | `docs/architecture.md` — capas, módulos, decisiones técnicas justificadas |
| 6     | Specs de Skills               | `specs/skills/SKILL-*.md` — una spec por cada skill del sistema |
| 7     | Specs de Managers             | `specs/managers/MANAGER-*.md` — una spec por cada manager |
| 8     | Spec del Router               | `specs/ROUTER.md` — intents, condiciones de ruteo y reglas de autenticación |
| 9     | Setup del proyecto            | Repo inicializado: scaffolding Nuxt + Express, `schema.prisma` generado desde el domain model, primera migración aplicada |
| 10    | Implementación de Skills      | `/src/skills/*.ts` con tests unitarios por cada regla de spec |


---

*Documento mantenido en: `docs/problem-statement.md`*
