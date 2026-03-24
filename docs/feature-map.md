# Feature Map — Deudometro

**Versión:** 0.1.0
**Fecha:** 2026-03-23
**Estado:** Draft

**Prioridades:**
- **P0 — Esencial:** sin esto el producto no existe. MVP bloqueante.
- **P1 — Importante:** añade valor real pero el producto funciona sin ello.
- **P2 — Deseable:** mejora la experiencia, candidato a iteraciones post-MVP.

**Dependencias:** una funcionalidad con dependencias no puede implementarse hasta que sus dependencias estén completas.

---

## Módulo 1 — Autenticación y cuenta

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-01 | Registro con email y contraseña (Supabase Auth) | P0 | — |
| F-02 | Login / logout | P0 | F-01 |
| F-03 | Creación automática de `UserProfile` al registrarse | P0 | F-01 |
| F-04 | Recuperación de contraseña por email | P1 | F-01 |
| F-05 | Editar nombre de perfil | P1 | F-03 |

---

## Módulo 2 — Ingreso de deudas (Paso 1)

Un formulario diferenciado por tipo de deuda. Cada tipo captura los campos definidos en `domain-model.md §4`.

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-10 | Registrar tarjeta de crédito (`credit_card`) | P0 | F-03 |
| F-11 | Registrar crédito de consumo (`consumer_loan`) | P0 | F-03 |
| F-12 | Registrar crédito hipotecario (`mortgage`) | P0 | F-03 |
| F-13 | Registrar deuda informal (`informal_lender`) | P0 | F-03 |
| F-14 | Editar deuda existente (cualquier tipo) | P0 | F-10–F-13 |
| F-15 | Marcar deuda como `paid_off` manualmente | P1 | F-10–F-13 |
| F-16 | Eliminar / archivar deuda | P1 | F-10–F-13 |
| F-17 | Visualizar lista de deudas con saldo, tasa y estado | P0 | F-10–F-13 |

---

## Módulo 3 — Perfil financiero (Pasos 2, 3 y 4)

Recopila los datos necesarios para calcular el `availableBudget` antes de generar un plan.

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-20 | Ingresar ingreso líquido mensual (Paso 2) | P0 | F-03 |
| F-21 | Ingresar gastos fijos por categoría con total automático (Paso 3) | P0 | F-20 |
| F-22 | Seleccionar porcentaje de reserva: 10/20/30/personalizado (Paso 4) | P0 | F-21 |
| F-23 | Visualizar cálculo del `availableBudget` antes de confirmar | P0 | F-22 |
| F-24 | Editar perfil financiero (ingresos y gastos) | P1 | F-20–F-22 |

---

## Módulo 4 — Dashboard financiero

Vista principal del usuario. Muestra la situación de deuda consolidada.

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-30 | Total de deuda consolidada (Σ `remainingBalance`) | P0 | F-17 |
| F-31 | Intereses mensuales totales (Σ `monthlyInterestCost` por deuda) | P0 | F-17 |
| F-32 | Indicador visual "deudómetro": progreso desde `originalBalance` a 0 | P0 | F-17 |
| F-33 | Tarjetas de deuda con estado y alerta visual si es crítica | P0 | F-17 |
| F-34 | Fecha estimada de libertad financiera (desde plan activo) | P0 | F-42 |
| F-35 | Comparativa de ahorro: con plan vs. solo mínimos | P1 | F-42 |
| F-36 | Gráfico de evolución de deuda proyectada mes a mes | P2 | F-42 |
| F-37 | Resumen del plan activo (`aiOutput.monthly_focus`) | P1 | F-42 |

---

## Módulo 5 — Generación del plan (Pasos 5 y 6)

Núcleo del producto. Combina el algoritmo de estrategia con la IA para producir un plan personalizado.

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-40 | Detección automática de deudas críticas (BR-06) | P0 | F-17, F-23 |
| F-41 | Presentación de estrategias según condición (críticas o no) — árbol del Paso 5 | P0 | F-40 |
| F-42 | Selección y confirmación de estrategia | P0 | F-41 |
| F-43 | Cálculo del plan de pagos: ordenamiento + `PlanActions` mes a mes | P0 | F-42 |
| F-44 | Construcción del prompt con los 5 secciones del Paso 6 | P0 | F-43 |
| F-45 | Llamada a IA y almacenamiento de `aiOutput` | P0 | F-44 |
| F-46 | Pantalla de plan generado: `summary`, `strategy_rationale`, `monthly_focus` | P0 | F-45 |
| F-47 | Timeline de milestones proyectados del plan (`key_milestones`) | P0 | F-45 |
| F-48 | Alertas de deudas críticas en el plan (`critical_alerts`) | P0 | F-45 |
| F-49 | Regenerar plan (con nueva estrategia o nuevo presupuesto) | P1 | F-42 |
| F-50 | Historial de planes anteriores (`superseded`) | P1 | F-49 |
| F-51 | Comparar dos estrategias lado a lado (simulador) | P2 | F-43 |

---

## Módulo 6 — Estrategias de pago

Definición y comportamiento de cada una de las 5 estrategias.

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-60 | Avalanche — ordenar por mayor tasa mensual (BR-13) | P0 | F-43 |
| F-61 | Snowball — ordenar por menor saldo (BR-14) | P0 | F-43 |
| F-62 | Hybrid — críticas por tasa, resto por avalanche (BR-15) | P0 | F-43 |
| F-63 | Crisis First — todas las críticas primero (BR-26) | P0 | F-43 |
| F-64 | Guided Consolidation — orden sugerido por score compuesto, ajustable por usuario (BR-28) | P1 | F-43 |

> **Guided Consolidation (F-64):** el sistema calcula un score ponderado combinando tasa mensual (60%) y saldo restante (40%). Propone un orden de ataque. El usuario puede arrastrar y reordenar las deudas antes de confirmar. El plan se genera con el orden final que el usuario valide. Esto la diferencia de Hybrid: en Hybrid el algoritmo decide solo; en Guided el usuario tiene la última palabra.

---

## Módulo 7 — Seguimiento de pagos

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-70 | Registrar pago contra una deuda | P0 | F-17 |
| F-71 | Asociar pago a `PlanAction` del plan activo | P0 | F-70, F-43 |
| F-72 | Actualización automática de `remainingBalance` al registrar pago | P0 | F-70 |
| F-73 | Marcado automático como `paid_off` al llegar a saldo 0 (BR-17) | P0 | F-72 |
| F-74 | Historial de pagos por deuda | P1 | F-70 |
| F-75 | Banner de alerta: deudas con vencimiento en los próximos 3 días | P1 | F-17 |
| F-76 | Notificación push/email de fecha de pago próxima | P2 | F-75 |

---

## Módulo 8 — Milestones y logros

| ID | Funcionalidad | Prioridad | Dependencias |
|----|---------------|-----------|--------------|
| F-80 | Detección automática de milestones al registrar un pago (BR-19–BR-21) | P0 | F-73 |
| F-81 | Notificación visual (modal/banner) de milestone no visto | P0 | F-80 |
| F-82 | Dismiss de milestone → `acknowledgedAt` (BR-22) | P0 | F-81 |
| F-83 | Feed de historial de logros reconocidos | P1 | F-82 |
| F-84 | Compartir milestone (card de imagen para redes sociales) | P2 | F-82 |

---

## Resumen de prioridades

| Prioridad | Cantidad | Módulos principales |
|-----------|----------|---------------------|
| P0 | 30 funcionalidades | Auth, deudas, perfil financiero, dashboard, plan, estrategias 1–4, pagos, milestones |
| P1 | 13 funcionalidades | Recuperación de contraseña, eliminar deuda, editar perfil, historial, alertas, Guided Consolidation |
| P2 | 5 funcionalidades | Gráfico de evolución, simulador comparativo, notificación push, compartir milestone |

---

## Dependencias críticas del flujo principal

```
F-01 (registro)
  └── F-03 (UserProfile)
        ├── F-10–F-13 (ingresar deudas)
        │     └── F-17 (lista de deudas)
        │           └── F-30–F-33 (dashboard)
        └── F-20–F-22 (perfil financiero)
              └── F-23 (ver availableBudget)
                    └── F-40–F-41 (detección críticas + árbol de estrategias)
                          └── F-42 (selección estrategia)
                                └── F-43 (cálculo PlanActions)
                                      └── F-44–F-45 (prompt + IA)
                                            └── F-46–F-48 (visualización plan)
                                                  └── F-70–F-73 (seguimiento pagos)
                                                        └── F-80–F-82 (milestones)
```

---

*Documento mantenido en: `docs/feature-map.md`*
