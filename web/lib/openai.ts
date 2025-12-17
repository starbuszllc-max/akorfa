import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;
let grokInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export function getGrok(): OpenAI {
  if (!grokInstance) {
    if (!process.env.GROK_API_KEY) {
      throw new Error('GROK_API_KEY environment variable is required');
    }
    grokInstance = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: 'https://api.x.ai/v1'
    });
  }
  return grokInstance;
}

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function hasGrokKey(): boolean {
  return !!process.env.GROK_API_KEY;
}

export function getAvailableAIProvider(): 'openai' | 'grok' | null {
  if (hasOpenAIKey()) return 'openai';
  if (hasGrokKey()) return 'grok';
  return null;
}

export function getAIClient(): OpenAI | null {
  if (hasOpenAIKey()) return getOpenAI();
  if (hasGrokKey()) return getGrok();
  return null;
}
