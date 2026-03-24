// SKILL: ai-plan-generator
// Spec: specs/skills/SKILL-ai-plan-generator.md
// Calls Claude API and validates the structured JSON response.

import { anthropic, CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from '../ai/claude.client'
import type { AiOutput } from '../types/domain'

export interface AiPlanGeneratorInput {
  systemPrompt: string
  userPrompt: string
}

export type AiPlanGeneratorOutput =
  | { success: true; aiOutput: AiOutput }
  | {
      success: false
      error: 'AI_GENERATION_FAILED'
      reason: 'API_ERROR' | 'INVALID_JSON' | 'INVALID_SHAPE' | 'TIMEOUT'
      rawResponse?: string
    }

export async function generateAiPlan(input: AiPlanGeneratorInput): Promise<AiPlanGeneratorOutput> {
  const { systemPrompt, userPrompt } = input

  let rawText: string

  try {
    // Rules 1-7: call Claude API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000) // Rule 7: 30s timeout

    let response
    try {
      response = await anthropic.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: CLAUDE_MAX_TOKENS,
          temperature: 0.3, // Rule 6
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        },
        { signal: controller.signal }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'AI_GENERATION_FAILED', reason: 'TIMEOUT' }
    }
    return { success: false, error: 'AI_GENERATION_FAILED', reason: 'API_ERROR' }
  }

  // Rule 8: parse JSON
  let parsed: unknown
  try {
    // Strip code fences if present (defensive)
    const jsonText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim()
    parsed = JSON.parse(jsonText)
  } catch {
    return { success: false, error: 'AI_GENERATION_FAILED', reason: 'INVALID_JSON', rawResponse: rawText }
  }

  // Rules 10-12: validate shape
  const shaped = validateShape(parsed)
  if (!shaped) {
    return { success: false, error: 'AI_GENERATION_FAILED', reason: 'INVALID_SHAPE', rawResponse: rawText }
  }

  return { success: true, aiOutput: shaped }
}

function validateShape(data: unknown): AiOutput | null {
  if (typeof data !== 'object' || data === null) return null

  const d = data as Record<string, unknown>

  if (typeof d.summary !== 'string') return null
  if (typeof d.strategy_rationale !== 'string') return null
  if (typeof d.monthly_focus !== 'string') return null
  if (!Array.isArray(d.key_milestones)) return null   // Rule 11
  if (!Array.isArray(d.critical_alerts)) return null  // Rule 12
  if (typeof d.free_date_message !== 'string') return null

  return {
    summary: d.summary,
    strategy_rationale: d.strategy_rationale,
    monthly_focus: d.monthly_focus,
    key_milestones: d.key_milestones as AiOutput['key_milestones'],
    critical_alerts: d.critical_alerts as string[],
    free_date_message: d.free_date_message,
  }
}
