import Groq from 'groq-sdk';
import OpenAI from 'openai';

let groqInstance: any = null;

export function getGroq() {
  if (!groqInstance) {
    // Try direct Groq API first (for Vercel production)
    if (process.env.GROQ_API_KEY) {
      groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    } 
    // Fall back to Replit OpenRouter integration (for dev)
    else if (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) {
      groqInstance = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
      });
    } 
    else {
      throw new Error('Groq/OpenRouter API not configured');
    }
  }
  return groqInstance;
}

export function hasGroq(): boolean {
  return !!(
    process.env.GROQ_API_KEY || 
    (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL)
  );
}
