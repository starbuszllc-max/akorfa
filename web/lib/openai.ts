import OpenAI from 'openai';
import Groq from 'groq-sdk';

let openaiInstance: OpenAI | null = null;
let groqInstance: Groq | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export function getGroq(): Groq {
  if (!groqInstance) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export function hasGroqKey(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export function getAvailableAIProvider(): 'openai' | 'groq' | null {
  if (hasOpenAIKey()) return 'openai';
  if (hasGroqKey()) return 'groq';
  return null;
}

export function getAIClient(): OpenAI | Groq | null {
  if (hasOpenAIKey()) return getOpenAI();
  if (hasGroqKey()) return getGroq();
  return null;
}
