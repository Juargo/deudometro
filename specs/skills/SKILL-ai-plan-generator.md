# SKILL: ai-plan-generator

**Versión:** 0.1.0 | **Etapa:** 6 — Specs de Skills

## Propósito
Enviar el prompt construido por `prompt-builder` a la API de Claude, recibir la respuesta, validar que sea JSON estructurado con el shape correcto y devolverlo tipado. Maneja el fallback si la IA falla.

## Input
```typescript
{
  systemPrompt: string
  userPrompt:   string
}
```

## Output
```typescript
// Éxito
{
  success: true
  aiOutput: {
    summary:            string
    strategy_rationale: string
    monthly_focus:      string
    key_milestones: {
      month:   number
      event:   string
      message: string
    }[]
    critical_alerts:    string[]
    free_date_message:  string
  }
}

// Error
{
  success:      false
  error:        'AI_GENERATION_FAILED'
  reason:       'API_ERROR' | 'INVALID_JSON' | 'INVALID_SHAPE' | 'TIMEOUT'
  rawResponse?: string   // para debugging — no exponer al usuario
}
```

## Reglas

### Llamada a la API
1. Usar el cliente `claude.client.ts` (wrapper del Anthropic SDK)
2. Modelo: `claude-sonnet-4-6`
3. `system`: el `systemPrompt` del input
4. `messages`: `[{ role: 'user', content: userPrompt }]`
5. `max_tokens`: 1024 — el output es JSON compacto, no necesita más
6. `temperature`: 0.3 — respuestas consistentes con mínima variabilidad
7. Timeout: 30 segundos. Si se supera → `reason: 'TIMEOUT'`

### Validación del output
8. La respuesta de la IA debe ser JSON puro — sin texto antes ni después. Intentar `JSON.parse(response.content[0].text)`
9. Si `JSON.parse` falla → `reason: 'INVALID_JSON'`, guardar el `rawResponse` para debug
10. Si el JSON parsea pero le faltan campos obligatorios (`summary`, `strategy_rationale`, `monthly_focus`, `key_milestones`, `critical_alerts`, `free_date_message`) → `reason: 'INVALID_SHAPE'`
11. `key_milestones` debe ser un array (puede ser vacío). Si no es array → `INVALID_SHAPE`
12. `critical_alerts` debe ser un array (puede ser vacío). Si no es array → `INVALID_SHAPE`

### Fallback
13. Si el skill retorna `success: false`, el `AnalysisManager` continúa y persiste el plan **sin** `aiOutput` (campo `null` en la DB). El usuario puede reintentar la generación del resumen IA desde la UI.
14. **No reintentar automáticamente** — si la IA falla, fallar rápido y dejar que el manager decida.

## Dependencias
- `claude.client.ts` → `anthropic.messages.create(params)` (Anthropic SDK)
- Variable de entorno: `ANTHROPIC_API_KEY`
