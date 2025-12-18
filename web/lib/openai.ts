import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function getAvailableAIProvider(): 'openai' | null {
  if (hasOpenAIKey()) return 'openai';
  return null;
}

export function getAIClient(): OpenAI | null {
  if (hasOpenAIKey()) return getOpenAI();
  return null;
}

export async function createChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  response_format?: { type: string };
}) {
  const client = getAIClient();
  if (!client) {
    throw new Error('No AI provider configured');
  }

  return await (client as OpenAI).chat.completions.create(params as any);
}
