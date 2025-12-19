import OpenAI from 'openai';

let groqInstance: OpenAI | null = null;

export function getGroq(): OpenAI {
  if (!groqInstance) {
    // Use Replit integration in development, direct Groq API in production
    const baseUrl = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }
    
    if (baseUrl) {
      // Replit integration
      groqInstance = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
      });
    } else {
      // Direct Groq API
      groqInstance = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: apiKey,
      });
    }
  }
  return groqInstance;
}

export function hasGroq(): boolean {
  return !!(
    process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || 
    process.env.GROQ_API_KEY
  );
}
