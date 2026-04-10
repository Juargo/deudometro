import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainError, AI_RESPONSE_INVALID } from '../../../src/shared/errors';

// Mock @anthropic-ai/sdk BEFORE importing the skill
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}));

import { ClaudeClientSkill } from '../../../src/skills/claude-client.skill';
import Anthropic from '@anthropic-ai/sdk';

const validAiResponse = {
  summary: 'Resumen de situación financiera.',
  strategy_rationale: 'Esta estrategia es óptima.',
  monthly_focus: 'Concentrarse en tarjeta BCI.',
  key_milestones: [{ month: 6, event: 'deuda_pagada', message: 'Excelente progreso.' }],
  critical_alerts: [],
  free_date_message: 'En junio 2027 serás libre de deudas.',
};

function makeApiResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
  };
}

describe('ClaudeClientSkill', () => {
  let skill: ClaudeClientSkill;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-get the mocked create function from the constructor mock
    const MockedAnthropic = vi.mocked(Anthropic);
    mockCreate = vi.fn();
    MockedAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as any);

    skill = new ClaudeClientSkill('test-api-key');
  });

  it('returns validated AiAnalysisOutput on success', async () => {
    mockCreate.mockResolvedValue(makeApiResponse(JSON.stringify(validAiResponse)));

    const result = await skill.call({ systemPrompt: 'sys', userPrompt: 'usr' });

    expect(result).toEqual(validAiResponse);
  });

  it('returns null on timeout (AbortError)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockCreate.mockRejectedValue(abortError);

    const result = await skill.call({ systemPrompt: 'sys', userPrompt: 'usr' });

    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    const networkError = new Error('Network connection failed');
    mockCreate.mockRejectedValue(networkError);

    const result = await skill.call({ systemPrompt: 'sys', userPrompt: 'usr' });

    expect(result).toBeNull();
  });

  it('throws AI_RESPONSE_INVALID when JSON missing required field', async () => {
    const incompleteResponse = {
      summary: 'Solo el resumen, sin los demás campos requeridos.',
      // missing: strategy_rationale, monthly_focus, key_milestones, critical_alerts, free_date_message
    };
    mockCreate.mockResolvedValue(makeApiResponse(JSON.stringify(incompleteResponse)));

    await expect(
      skill.call({ systemPrompt: 'sys', userPrompt: 'usr' })
    ).rejects.toMatchObject({ code: AI_RESPONSE_INVALID, httpStatus: 502 });
  });

  it('throws AI_RESPONSE_INVALID when response is not valid JSON', async () => {
    mockCreate.mockResolvedValue(makeApiResponse('esto no es JSON válido {{{'));

    await expect(
      skill.call({ systemPrompt: 'sys', userPrompt: 'usr' })
    ).rejects.toMatchObject({ code: AI_RESPONSE_INVALID, httpStatus: 502 });
  });
});
