'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Brain, Send, Sparkles, Users, Crown, Zap, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  id: string;
  topic: string;
  layer: string;
  messages: Message[];
  createdAt: string;
}

const TOPIC_SUGGESTIONS = [
  { icon: Brain, label: 'Human Behavior', prompt: 'Explain cognitive biases and how they affect our daily decisions' },
  { icon: Users, label: 'Social Systems', prompt: 'How do communities build and maintain trust?' },
  { icon: Crown, label: 'Leadership', prompt: 'What makes an effective and ethical leader?' },
  { icon: Zap, label: 'Stability Equation', prompt: 'Explain the Stability Equation S = R(L+G) / (|L-G| + C) with examples' }
];

export default function AIMentorPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    if (uid) {
      fetchSessions(uid);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchSessions(uid: string) {
    try {
      const res = await fetch(`/api/ai-mentor?user_id=${uid}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }

  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || !userId) return;

    setInput('');
    const newMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newMessage]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: text
        })
      });

      const data = await res.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        if (data.session?.id && !sessionId) {
          setSessionId(data.session.id);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error. Please try again.' 
      }]);
    }
    setLoading(false);
  }

  function startNewSession() {
    setSessionId(null);
    setMessages([]);
  }

  function loadSession(session: Session) {
    setSessionId(session.id);
    setMessages(session.messages || []);
  }

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          AI Mentor
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Sign up to access your personal AI mentor.
        </p>
        <a
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
        >
          Get Started
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 h-full overflow-hidden flex flex-col">
            <button
              onClick={startNewSession}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              New Session
            </button>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                Recent Sessions
              </p>
              {sessions.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No sessions yet</p>
              ) : (
                sessions.slice(0, 10).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      sessionId === session.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium truncate">{session.topic || 'General Chat'}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Akorfa AI Mentor</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your guide to human systems</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Insight School
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  I'm here to teach you about human behavior, social systems, leadership, and the Stability Equation.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                  {TOPIC_SUGGESTIONS.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(topic.prompt)}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-left"
                    >
                      <topic.icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{topic.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about human systems, behavior, or leadership..."
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
