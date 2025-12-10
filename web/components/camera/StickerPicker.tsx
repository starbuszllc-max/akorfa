'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Image as ImageIcon } from 'lucide-react';

interface Sticker {
  id: string;
  url: string;
  title: string;
}

const EMOJI_STICKERS = [
  '😀', '😂', '🥰', '😎', '🤩', '🥳', '😍', '🤔',
  '😴', '🤯', '😱', '🥺', '😤', '🤗', '🙄', '😏',
  '❤️', '🔥', '⭐', '✨', '💯', '🎉', '🎊', '💪',
  '👍', '👏', '🙌', '🤝', '✌️', '🤟', '👋', '💅',
  '🌟', '🌈', '☀️', '🌙', '⚡', '💫', '🌸', '🌺',
  '🎵', '🎶', '🎤', '🎸', '🎹', '🥁', '🎧', '📱',
  '💖', '💕', '💗', '💓', '💝', '💘', '❣️', '💔'
];

interface StickerPickerProps {
  onSelect: (sticker: { type: 'emoji' | 'gif'; content: string }) => void;
  onClose: () => void;
}

export default function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const [tab, setTab] = useState<'emoji' | 'gif'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'gif' && searchQuery.length > 0) {
      const debounce = setTimeout(() => {
        searchGifs(searchQuery);
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, tab]);

  const searchGifs = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/giphy?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setGifs(data.gifs || []);
      }
    } catch (error) {
      console.error('Failed to search GIFs:', error);
    }
    setLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    onSelect({ type: 'emoji', content: emoji });
  };

  const handleGifSelect = (gif: Sticker) => {
    onSelect({ type: 'gif', content: gif.url });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl max-h-[70vh] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex gap-4">
          <button
            onClick={() => setTab('emoji')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              tab === 'emoji' ? 'bg-white text-black' : 'text-gray-400'
            }`}
          >
            Emoji
          </button>
          <button
            onClick={() => setTab('gif')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              tab === 'gif' ? 'bg-white text-black' : 'text-gray-400'
            }`}
          >
            GIFs
          </button>
        </div>
        <button onClick={onClose} className="text-gray-400 p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {tab === 'gif' && (
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'emoji' ? (
          <div className="grid grid-cols-8 gap-2">
            {EMOJI_STICKERS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-3xl p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
              </div>
            ) : gifs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifSelect(gif)}
                    className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <img
                      src={gif.url}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <ImageIcon className="w-12 h-12 mb-3" />
                <p>No GIFs found</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Search className="w-12 h-12 mb-3" />
                <p>Search for GIFs</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
