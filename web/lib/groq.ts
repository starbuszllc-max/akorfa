import OpenAI from 'openai';

let groqInstance: OpenAI | null = null;

export function getGroq(): OpenAI {
  if (!groqInstance) {
    const baseUrl = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
    
    if (!baseUrl || !apiKey) {
      throw new Error('OpenRouter (Groq) integration not configured');
    }
    
    groqInstance = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });
  }
  return groqInstance;
}

export function hasGroq(): boolean {
  return !!process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && 
         !!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
}
