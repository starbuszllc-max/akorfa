'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Music, Wand2, Smile, Type, Sparkles, Flower, Crop, Settings, ChevronDown, Plus, Minus
} from 'lucide-react';
import TextOverlayEditor, { TextOverlay } from './TextOverlayEditor';

interface VideoEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onComplete: (editedMedia: {
    url: string;
    type: 'image' | 'video';
    textOverlays: TextOverlay[];
    stickers: { type: 'emoji' | 'gif'; content: string; x: number; y: number }[];
    music: { title: string; artist: string; url: string } | null;
    filters: string | null;
    background: string | null;
  }) => void;
  onBack: () => void;
}

const FILTERS = [
  { id: 'none', name: 'None', filter: 'none' },
  { id: 'bright', name: 'Bright', filter: 'brightness(1.2)' },
  { id: 'vivid', name: 'Vivid', filter: 'saturate(1.4)' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(180deg)' },
  { id: 'warm', name: 'Warm', filter: 'sepia(0.4) brightness(1.1)' },
  { id: 'bw', name: 'B&W', filter: 'grayscale(1)' },
  { id: 'invert', name: 'Invert', filter: 'invert(1)' },
  { id: 'blur', name: 'Blur', filter: 'blur(5px)' },
  { id: 'dark', name: 'Dark', filter: 'brightness(0.8) contrast(1.2)' },
  { id: 'retro', name: 'Retro', filter: 'sepia(0.8) saturate(0.8)' },
];

const EFFECTS = [
  { id: 'vignette', name: 'Vignette', svg: 'M0,0 Q20,50 0,100 L100,100 Q80,50 100,0 Z' },
  { id: 'glitch', name: 'Glitch', svg: 'M0,20 L100,20 M0,50 L100,50 M0,80 L100,80' },
  { id: 'wave', name: 'Wave', svg: 'M0,50 Q25,25 50,50 T100,50' },
];

const EMOJIS = ['😀', '😂', '😍', '🔥', '💯', '✨', '🎉', '👍', '❤️', '🎬', '⭐', '🌟', '🎮', '🚀', '💎', '👑'];

const TEMPLATES = [
  { id: 't1', name: 'Duet', colors: ['from-pink-500', 'to-red-500'] },
  { id: 't2', name: 'Stitch', colors: ['from-purple-500', 'to-blue-500'] },
  { id: 't3', name: 'Split', colors: ['from-green-500', 'to-teal-500'] },
];

const SONGS = [
  { id: '1', title: 'Trending Sound', artist: 'TikTok', url: '/sounds/trending.mp3' },
  { id: '2', title: 'Popular Beat', artist: 'Creator', url: '/sounds/beat.mp3' },
  { id: '3', title: 'Viral Music', artist: 'Artist', url: '/sounds/viral.mp3' },
];

export default function VideoEditor({ mediaUrl, mediaType, onComplete, onBack }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<{ type: 'emoji' | 'gif'; content: string; x: number; y: number; id: string }[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState(SONGS[0]);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  const handleAddSticker = (emoji: string) => {
    const newSticker = {
      id: Date.now().toString(),
      type: 'emoji' as const,
      content: emoji,
      x: 50,
      y: 50
    };
    setStickers([...stickers, newSticker]);
  };

  const handleComplete = () => {
    onComplete({
      url: mediaUrl,
      type: mediaType,
      textOverlays,
      stickers: stickers.map(s => ({ type: s.type, content: s.content, x: s.x, y: s.y })),
      music: selectedSong,
      filters: selectedFilter !== 'none' ? selectedFilter : null,
      background: selectedEffect
    });
  };

  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header with Music */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/80 backdrop-blur"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={onBack} className="text-white hover:text-gray-400 transition">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full">
          <Music className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white truncate max-w-xs">{selectedSong.title}</span>
          <X className="w-4 h-4 text-gray-500 cursor-pointer" />
        </div>

        <button onClick={() => togglePanel('settings')} className="text-gray-400 hover:text-white">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        {/* Canvas */}
        <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.filter || 'none' }}
              loop
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.filter || 'none' }}
            />
          )}

          {/* Text Overlays */}
          {textOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute px-2 py-1 rounded cursor-move"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${overlay.fontSize}px`,
                fontWeight: overlay.fontWeight,
                fontStyle: overlay.fontStyle,
                textAlign: overlay.textAlign,
                color: overlay.color,
                backgroundColor: overlay.backgroundColor,
                fontFamily: overlay.fontFamily || 'sans-serif',
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                zIndex: 10
              }}
            >
              {overlay.text}
            </div>
          ))}

          {/* Stickers */}
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute text-4xl cursor-move select-none hover:scale-110 transition-transform"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
              draggable
              onDragEnd={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const newX = ((e.clientX - rect.left) / rect.width) * 100;
                  const newY = ((e.clientY - rect.top) / rect.height) * 100;
                  setStickers(stickers.map(s => 
                    s.id === sticker.id ? { ...s, x: Math.max(0, Math.min(100, newX)), y: Math.max(0, Math.min(100, newY)) } : s
                  ));
                }
              }}
            >
              {sticker.content}
            </div>
          ))}
        </div>

        {/* Right Side Toolbar */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
          {/* AI Alive */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('ai')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'ai'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="AI"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>

          {/* Edit */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('edit')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'edit'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Edit"
          >
            <Wand2 className="w-6 h-6" />
          </motion.button>

          {/* Templates */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('templates')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'templates'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Templates"
          >
            <div className="w-6 h-6 flex items-center justify-center text-lg">📱</div>
          </motion.button>

          {/* Text */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTextEditor(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-800/80 text-gray-300 hover:bg-gray-700 transition-all"
            title="Text"
          >
            <Type className="w-6 h-6" />
          </motion.button>

          {/* Stickers */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('stickers')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'stickers'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Stickers"
          >
            <Smile className="w-6 h-6" />
          </motion.button>

          {/* Effects */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('effects')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'effects'
                ? 'bg-pink-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Effects"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>

          {/* Filters */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('filters')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'filters'
                ? 'bg-teal-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Filters"
          >
            <Flower className="w-6 h-6" />
          </motion.button>

          {/* Crop */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => togglePanel('crop')}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              activePanel === 'crop'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700'
            }`}
            title="Crop"
          >
            <Crop className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Bottom Panels */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 rounded-t-3xl max-h-96 overflow-y-auto z-40"
            >
              {/* Music Panel */}
              {activePanel === 'music' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Select Music</h3>
                  {SONGS.map((song) => (
                    <motion.button
                      key={song.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedSong(song)}
                      className={`w-full p-4 rounded-lg transition-all text-left ${
                        selectedSong.id === song.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Music className="w-4 h-4 inline mr-2" />
                      <div>
                        <p className="font-medium">{song.title}</p>
                        <p className="text-xs opacity-75">{song.artist}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Filters Panel */}
              {activePanel === 'filters' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Filters</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {FILTERS.map((f) => (
                      <motion.button
                        key={f.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedFilter(f.id)}
                        className={`p-3 rounded-lg text-xs font-medium transition-all ${
                          selectedFilter === f.id
                            ? 'bg-teal-600 text-white ring-2 ring-teal-400'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {f.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stickers Panel */}
              {activePanel === 'stickers' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Stickers</h3>
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleAddSticker(emoji)}
                        className="p-2 bg-gray-800 rounded-lg text-2xl hover:bg-gray-700 transition-all"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Effects Panel */}
              {activePanel === 'effects' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Effects</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {EFFECTS.map((e) => (
                      <motion.button
                        key={e.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedEffect(selectedEffect === e.id ? null : e.id)}
                        className={`p-4 rounded-lg font-medium text-sm transition-all ${
                          selectedEffect === e.id
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {e.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Panel */}
              {activePanel === 'templates' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Templates</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((t) => (
                      <motion.button
                        key={t.id}
                        whileHover={{ scale: 1.05 }}
                        className={`p-4 rounded-lg font-medium text-sm transition-all bg-gradient-to-br ${t.colors[0]} ${t.colors[1]} text-white hover:shadow-lg`}
                      >
                        {t.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Panel */}
              {activePanel === 'ai' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">AI Alive</h3>
                  <p className="text-gray-400 text-sm">AI-powered effects coming soon</p>
                </div>
              )}

              {/* Edit Panel */}
              {activePanel === 'edit' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Edit</h3>
                  <button className="w-full p-3 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-all">
                    Speed & Volume
                  </button>
                </div>
              )}

              {/* Crop Panel */}
              {activePanel === 'crop' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-white font-bold text-lg">Crop</h3>
                  <p className="text-gray-400 text-sm">Drag the corners to crop</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex gap-4 p-4 border-t border-gray-800 bg-black/80 backdrop-blur">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all"
        >
          Edit More
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
        >
          Next
        </button>
      </div>

      {/* Text Editor Modal */}
      <AnimatePresence>
        {showTextEditor && (
          <TextOverlayEditor
            overlays={textOverlays}
            onUpdate={setTextOverlays}
            onClose={() => setShowTextEditor(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
