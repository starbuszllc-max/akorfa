'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
}

const COLORS = [
  '#ffffff', '#000000', '#ff0000', '#ff6b6b', '#ffa500', '#ffd93d',
  '#00ff00', '#6bcb77', '#00bfff', '#4d96ff', '#9b59b6', '#ff69b4'
];

const FONT_SIZES = [16, 20, 24, 32, 40, 48, 56];

interface TextOverlayEditorProps {
  overlays: TextOverlay[];
  onUpdate: (overlays: TextOverlay[]) => void;
  onClose: () => void;
}

export default function TextOverlayEditor({ overlays, onUpdate, onClose }: TextOverlayEditorProps) {
  const [currentOverlay, setCurrentOverlay] = useState<TextOverlay>({
    id: Date.now().toString(),
    text: '',
    x: 50,
    y: 50,
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    color: '#ffffff',
    backgroundColor: 'transparent'
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (currentOverlay.text.trim()) {
      onUpdate([...overlays, currentOverlay]);
      setCurrentOverlay({
        ...currentOverlay,
        id: Date.now().toString(),
        text: ''
      });
    }
  };

  const handleDone = () => {
    if (currentOverlay.text.trim()) {
      onUpdate([...overlays, currentOverlay]);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
    >
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <button onClick={handleDone} className="text-white px-4 py-2 bg-indigo-600 rounded-full text-sm font-medium">
          Done
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="relative max-w-sm w-full aspect-[9/16] bg-gray-800 rounded-xl overflow-hidden"
        >
          {overlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute px-2 py-1 rounded"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: overlay.fontSize,
                fontWeight: overlay.fontWeight,
                fontStyle: overlay.fontStyle,
                textAlign: overlay.textAlign,
                color: overlay.color,
                backgroundColor: overlay.backgroundColor
              }}
            >
              {overlay.text}
            </div>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={currentOverlay.text}
            onChange={(e) => setCurrentOverlay({ ...currentOverlay, text: e.target.value })}
            placeholder="Enter text..."
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent border-none outline-none text-center"
            style={{
              fontSize: currentOverlay.fontSize,
              fontWeight: currentOverlay.fontWeight,
              fontStyle: currentOverlay.fontStyle,
              color: currentOverlay.color,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
            autoFocus
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentOverlay({
              ...currentOverlay,
              fontWeight: currentOverlay.fontWeight === 'bold' ? 'normal' : 'bold'
            })}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentOverlay.fontWeight === 'bold' ? 'bg-white text-black' : 'bg-white/20 text-white'
            }`}
          >
            <Bold className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentOverlay({
              ...currentOverlay,
              fontStyle: currentOverlay.fontStyle === 'italic' ? 'normal' : 'italic'
            })}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentOverlay.fontStyle === 'italic' ? 'bg-white text-black' : 'bg-white/20 text-white'
            }`}
          >
            <Italic className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentOverlay({ ...currentOverlay, textAlign: 'left' })}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentOverlay.textAlign === 'left' ? 'bg-white text-black' : 'bg-white/20 text-white'
            }`}
          >
            <AlignLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentOverlay({ ...currentOverlay, textAlign: 'center' })}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentOverlay.textAlign === 'center' ? 'bg-white text-black' : 'bg-white/20 text-white'
            }`}
          >
            <AlignCenter className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentOverlay({ ...currentOverlay, textAlign: 'right' })}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentOverlay.textAlign === 'right' ? 'bg-white text-black' : 'bg-white/20 text-white'
            }`}
          >
            <AlignRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 text-white"
          >
            <Palette className="w-5 h-5" />
          </button>
        </div>

        {showColorPicker && (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentOverlay({ ...currentOverlay, color })}
                className={`w-8 h-8 rounded-full border-2 ${
                  currentOverlay.color === color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setCurrentOverlay({ ...currentOverlay, fontSize: size })}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentOverlay.fontSize === size ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          disabled={!currentOverlay.text.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
        >
          Add Text
        </button>
      </div>
    </motion.div>
  );
}

export type { TextOverlay };
