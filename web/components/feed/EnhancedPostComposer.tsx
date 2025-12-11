'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useAuth } from '@/hooks/useAuth';

const layers = [
  { value: 'environment', label: 'Environment', emoji: '🌍', color: 'bg-emerald-500' },
  { value: 'bio', label: 'Biological', emoji: '🧬', color: 'bg-rose-500' },
  { value: 'internal', label: 'Internal', emoji: '🧠', color: 'bg-purple-500' },
  { value: 'cultural', label: 'Cultural', emoji: '🎭', color: 'bg-amber-500' },
  { value: 'social', label: 'Social', emoji: '👥', color: 'bg-blue-500' },
  { value: 'conscious', label: 'Conscious', emoji: '💭', color: 'bg-indigo-500' },
  { value: 'existential', label: 'Existential', emoji: '✨', color: 'bg-violet-500' },
] as const;

const aiSuggestions = [
  { text: "Share how you're feeling today", icon: '💭' },
  { text: "What's one thing you're grateful for?", icon: '🙏' },
  { text: "Describe a small win from today", icon: '🏆' },
  { text: "What are you working on improving?", icon: '📈' },
];

interface EnhancedPostComposerProps {
  onPostCreated?: () => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function EnhancedPostComposer({ onPostCreated, onToast }: EnhancedPostComposerProps) {
  const { user, loading: authLoading } = useAuth();
  const [content, setContent] = useState('');
  const [layer, setLayer] = useState('social');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const autoGrow = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  useEffect(() => {
    autoGrow();
  }, [content, autoGrow]);

  async function submitPost(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    if (!user) {
      onToast?.('Please sign in to post', 'error');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, layer })
      });

      if (resp.ok) {
        setContent('');
        onPostCreated?.();
        onToast?.('Post shared successfully!', 'success');
      } else {
        const error = await resp.json();
        console.error('Error creating post:', error);
        onToast?.(error.error || 'Failed to create post', 'error');
      }
    } catch (err) {
      console.error(err);
      onToast?.('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleEmojiSelect(emoji: any) {
    setContent(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  }

  function handleSuggestionClick(suggestion: string) {
    setContent(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  }

  if (authLoading) {
    return (
      <div className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 text-center"
      >
        <div className="text-3xl mb-3">✍️</div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Join the conversation</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Sign in to share your thoughts and connect with others</p>
        <motion.a 
          href="/auth/login"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
        >
          Sign In to Post
        </motion.a>
      </motion.div>
    );
  }

  const selectedLayer = layers.find(l => l.value === layer);
  const userAvatar = user.user_metadata?.avatar_url;
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submitPost}
      className="p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 dark:border-slate-700"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shrink-0 text-lg shadow-lg shadow-indigo-500/25 overflow-hidden">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            aria-label="Create post"
            className="w-full border-0 p-0 resize-none focus:ring-0 focus:outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent text-base leading-relaxed min-h-[60px]"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (showSuggestions && e.target.value.length > 0) {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => content.length === 0 && setShowSuggestions(true)}
            placeholder="What's on your mind? Share your journey..."
            maxLength={500}
          />
        </div>
      </div>

      <AnimatePresence>
        {showSuggestions && content.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <span>✨</span> AI Suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 text-xs rounded-full transition-colors flex items-center gap-1"
                >
                  <span>{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerDropdown(!showLayerDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${selectedLayer?.color}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{selectedLayer?.emoji} {selectedLayer?.label}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {showLayerDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-20"
                >
                  {layers.map(l => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => {
                        setLayer(l.value);
                        setShowLayerDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${layer === l.value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{l.emoji} {l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Add emoji"
              >
                <span className="text-lg">😊</span>
              </button>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute left-0 top-full mt-1 z-30"
                  >
                    <Picker 
                      data={data} 
                      onEmojiSelect={handleEmojiSelect}
                      theme="auto"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Add media (coming soon)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Attach file (coming soon)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs ${content.length > 450 ? 'text-amber-500' : content.length > 500 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {content.length}/500
          </span>
          <motion.button 
            type="submit" 
            disabled={loading || !content.trim() || content.length > 500}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              'Post'
            )}
          </motion.button>
        </div>
      </div>
    </motion.form>
  );
}
