import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { logger } from '../config/logger';
import { DomainError, AI_RESPONSE_INVALID } from '../shared/errors';

const AiAnalysisOutputSchema = z.object({
  summary: z.string(),
  strategy_rationale: z.string(),
  monthly_focus: z.string(),
  key_milestones: z.array(
    z.object({ month: z.number(), event: z.string(), message: z.string() })
  ),
  critical_alerts: z.array(z.string()),
  free_date_message: z.string(),
});

export type AiAnalysisOutput = z.infer<typeof AiAnalysisOutputSchema>;

export class ClaudeClientSkill {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async callWithSchema<T>(
    input: { systemPrompt: string; userPrompt: string },
    schema: z.ZodType<T>,
    options?: { maxTokens?: number }
  ): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      logger.info({ operation: 'claude.call' }, 'Calling Claude API');

      const response = await this.client.messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: options?.maxTokens ?? 1024,
          temperature: 0.3,
          system: input.systemPrompt,
          messages: [{ role: 'user', content: input.userPrompt }],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const text = response.content[0]?.type === 'text' ? response.content[0].text : null;
      if (!text) {
        logger.warn({ operation: 'claude.call' }, 'Claude returned empty content');
        throw new DomainError(AI_RESPONSE_INVALID, 502, 'Claude returned empty content');
      }

      // Strip markdown code fences if Claude wraps the JSON
      const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        logger.warn({ operation: 'claude.call', text }, 'Claude response is not valid JSON');
        throw new DomainError(AI_RESPONSE_INVALID, 502, 'Claude response is not valid JSON');
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        logger.warn(
          { operation: 'claude.call', errors: result.error.flatten().fieldErrors },
          'Claude response failed schema validation'
        );
        throw new DomainError(AI_RESPONSE_INVALID, 502, 'Claude response failed schema validation');
      }

      logger.info({ operation: 'claude.call' }, 'Claude API call succeeded');
      return result.data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof DomainError) throw err;

      // AbortError = timeout, or network errors → return null (don't throw)
      const isAbort =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.includes('aborted'));

      if (isAbort) {
        logger.warn({ operation: 'claude.call' }, 'Claude API call timed out');
        return null;
      }

      // Other network / transport errors → also return null
      logger.warn({ operation: 'claude.call', err }, 'Claude API network error');
      return null;
    }
  }

  async call(input: {
    systemPrompt: string;
    userPrompt: string;
  }): Promise<AiAnalysisOutput | null> {
    return this.callWithSchema(input, AiAnalysisOutputSchema);
  }
}
