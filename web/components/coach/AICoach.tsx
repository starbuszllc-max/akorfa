'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Lightbulb } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Suggestion {
  title: string;
  description: string;
  layer: string;
}

interface AICoachProps {
  userId: string;
}

const layerColors: Record<string, string> = {
  physical: 'bg-red-100 text-red-700',
  emotional: 'bg-orange-100 text-orange-700',
  mental: 'bg-yellow-100 text-yellow-700',
  social: 'bg-green-100 text-green-700',
  professional: 'bg-blue-100 text-blue-700',
  spiritual: 'bg-purple-100 text-purple-700',
  financial: 'bg-emerald-100 text-emerald-700'
};

export function AICoach({ userId }: AICoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/ai-coach?user_id=${userId}`);
        const data = await res.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
        if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
      setSuggestionsLoading(false);
    }
    fetchSuggestions();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage,
          conversation_history: messages
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I apologize, but I encountered an issue. Please try again later.' 
        }]);
      } else if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to connect to the AI coach');
    }
    setLoading(false);
  }

  function useSuggestion(suggestion: Suggestion) {
    setInput(`Tell me more about improving my ${suggestion.layer} layer: ${suggestion.title}`);
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && messages.length === 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Lightbulb className="w-4 h-4" />
            <span>Personalized suggestions for you</span>
          </div>
          <div className="grid gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => useSuggestion(suggestion)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${layerColors[suggestion.layer.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                    {suggestion.layer}
                  </span>
                  <span className="font-medium text-gray-800">{suggestion.title}</span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestionsLoading && messages.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-500">Loading your personalized insights...</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[200px]">
        {messages.length === 0 && !suggestionsLoading && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Your AI Growth Coach</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Ask me anything about your personal development journey. I can help with goals, 
              habits, insights from your assessments, and suggestions for improvement.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your growth coach..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
