'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Type, Music, Sticker, Scissors, Volume2, VolumeX,
  RotateCcw, Play, Pause, Undo2, Redo2, Sparkles, Wand2
} from 'lucide-react';
import TextOverlayEditor, { TextOverlay } from './TextOverlayEditor';
import StickerPicker from './StickerPicker';
import MusicPicker from './MusicPicker';

interface VideoEditorProps {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  onComplete: (editedMedia: {
    url: string;
    type: 'image' | 'video';
    textOverlays: TextOverlay[];
    stickers: { type: 'emoji' | 'gif'; content: string; x: number; y: number }[];
    music: { title: string; artist: string; url: string } | null;
  }) => void;
  onBack: () => void;
}

interface StickerItem {
  id: string;
  type: 'emoji' | 'gif';
  content: string;
  x: number;
  y: number;
}

interface HistoryState {
  textOverlays: TextOverlay[];
  stickers: StickerItem[];
}

export default function VideoEditor({ mediaUrl, mediaType, onComplete, onBack }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<any>(null);
  
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  
  const [history, setHistory] = useState<HistoryState[]>([{ textOverlays: [], stickers: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.onloadedmetadata = () => {
        setDuration(videoRef.current?.duration || 0);
      };
      videoRef.current.ontimeupdate = () => {
        setCurrentTime(videoRef.current?.currentTime || 0);
      };
    }
  }, [mediaType]);

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ textOverlays: [...textOverlays], stickers: [...stickers] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTextOverlays([...history[newIndex].textOverlays]);
      setStickers([...history[newIndex].stickers]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTextOverlays([...history[newIndex].textOverlays]);
      setStickers([...history[newIndex].stickers]);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTextUpdate = (newOverlays: TextOverlay[]) => {
    setTextOverlays(newOverlays);
    saveToHistory();
  };

  const handleStickerSelect = (sticker: { type: 'emoji' | 'gif'; content: string }) => {
    const newSticker: StickerItem = {
      id: Date.now().toString(),
      ...sticker,
      x: 50,
      y: 50
    };
    setStickers([...stickers, newSticker]);
    saveToHistory();
    setShowStickerPicker(false);
  };

  const handleComplete = () => {
    onComplete({
      url: mediaUrl,
      type: mediaType,
      textOverlays,
      stickers: stickers.map(s => ({ type: s.type, content: s.content, x: s.x, y: s.y })),
      music: selectedMusic
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div
        className="flex items-center justify-between p-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={onBack} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex === 0}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-30"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-30"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleComplete}
          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium"
        >
          Next
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden">
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              loop
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )}

          {textOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute cursor-move px-2 py-1 rounded"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: overlay.fontSize,
                fontWeight: overlay.fontWeight,
                fontStyle: overlay.fontStyle,
                textAlign: overlay.textAlign,
                color: overlay.color,
                backgroundColor: overlay.backgroundColor,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {overlay.text}
            </div>
          ))}

          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute cursor-move"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {sticker.type === 'emoji' ? (
                <span className="text-5xl">{sticker.content}</span>
              ) : (
                <img src={sticker.content} alt="sticker" className="w-24 h-24 object-contain" />
              )}
            </div>
          ))}

          {selectedMusic && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
              <Music className="w-5 h-5 text-white" />
              <div className="flex-1 truncate">
                <p className="text-white text-sm font-medium truncate">{selectedMusic.title}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {mediaType === 'video' && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={togglePlayPause} className="text-white">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="text-white text-xs">{formatTime(currentTime)}/{formatTime(duration)}</span>
            <button onClick={toggleMute} className="text-white">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      <div
        className="p-4 flex items-center justify-center gap-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <button
          onClick={() => setShowTextEditor(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Type className="w-6 h-6" />
          </div>
          <span className="text-xs">Text</span>
        </button>

        <button
          onClick={() => setShowStickerPicker(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Sticker className="w-6 h-6" />
          </div>
          <span className="text-xs">Stickers</span>
        </button>

        <button
          onClick={() => setShowMusicPicker(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMusic ? 'bg-indigo-600' : 'bg-white/10'}`}>
            <Music className="w-6 h-6" />
          </div>
          <span className="text-xs">Sound</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs">Effects</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <Scissors className="w-6 h-6" />
          </div>
          <span className="text-xs">Trim</span>
        </button>
      </div>

      <AnimatePresence>
        {showTextEditor && (
          <TextOverlayEditor
            overlays={textOverlays}
            onUpdate={handleTextUpdate}
            onClose={() => setShowTextEditor(false)}
          />
        )}

        {showStickerPicker && (
          <StickerPicker
            onSelect={handleStickerSelect}
            onClose={() => setShowStickerPicker(false)}
          />
        )}

        {showMusicPicker && (
          <MusicPicker
            selectedTrack={selectedMusic}
            onSelect={setSelectedMusic}
            onClose={() => setShowMusicPicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
