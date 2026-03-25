// Shared milestone enrichment — adds label/description from context or fallback

const milestoneFallbacks: Record<string, { label: string; description: string }> = {
  first_payment: { label: 'Primer pago', description: '¡Registraste tu primer pago!' },
  debt_paid_off: { label: '¡Deuda saldada!', description: 'Pagaste completamente una deuda.' },
  plan_on_track: { label: 'Plan al día', description: 'Tu plan de pagos va por buen camino.' },
  total_reduced_25pct: { label: '25% de deuda reducida', description: 'Has reducido tu deuda total en un 25%.' },
  total_reduced_50pct: { label: '50% de deuda reducida', description: 'Has reducido tu deuda total en un 50%.' },
  total_reduced_75pct: { label: '75% de deuda reducida', description: 'Has reducido tu deuda total en un 75%.' },
}

export function enrichMilestone(m: Record<string, unknown>) {
  const ctx = (m.context ?? {}) as Record<string, unknown>
  const fallback = milestoneFallbacks[m.type as string] ?? { label: String(m.type), description: '' }
  return {
    ...m,
    label: ctx.label ?? fallback.label,
    description: ctx.description ?? fallback.description,
  }
}
