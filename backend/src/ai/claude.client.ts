import Anthropic from '@anthropic-ai/sdk'

// Singleton Anthropic client — model: claude-sonnet-4-6 (ADR-05)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-6'
export const CLAUDE_MAX_TOKENS = 1024
