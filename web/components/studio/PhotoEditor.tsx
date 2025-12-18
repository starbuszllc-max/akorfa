'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Crop, Sun, Contrast, Droplets,
  ChevronLeft, Download, Type, Palette,
  Undo, Redo, ZoomIn, ZoomOut
} from 'lucide-react';

interface PhotoEditorProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  onSave?: (editedBlob: Blob) => void;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}

const filters = [
  { name: 'None', value: '' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
  { name: 'Cool', value: 'hue-rotate(180deg) saturate(80%)' },
  { name: 'Vintage', value: 'sepia(50%) contrast(90%) brightness(90%)' },
  { name: 'Dramatic', value: 'contrast(150%) saturate(150%)' },
  { name: 'Fade', value: 'contrast(80%) brightness(110%) saturate(80%)' },
  { name: 'Vivid', value: 'saturate(180%) contrast(110%)' },
  { name: 'Noir', value: 'grayscale(100%) contrast(120%)' },
];

export default function PhotoEditor({ imageUrl, imageName, onClose, onSave }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    rotation: 0,
    flipX: false,
    flipY: false
  });
  const [activeFilter, setActiveFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'transform' | 'text'>('adjust');
  const [zoom, setZoom] = useState(1);
  const [textOverlays, setTextOverlays] = useState<{ text: string; x: number; y: number; color: string; size: number }[]>([]);
  const [newText, setNewText] = useState('');

  const getFilterStyle = useCallback(() => {
    const { brightness, contrast, saturation, blur } = adjustments;
    let filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (blur > 0) filter += ` blur(${blur}px)`;
    if (activeFilter) filter += ` ${activeFilter}`;
    return filter;
  }, [adjustments, activeFilter]);

  const getTransformStyle = useCallback(() => {
    const { rotation, flipX, flipY } = adjustments;
    return `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1}) scale(${zoom})`;
  }, [adjustments, zoom]);

  const handleAdjustmentChange = (key: keyof Adjustments, value: number | boolean) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    setAdjustments(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'cw' ? 90 : -90)
    }));
  };

  const handleFlip = (axis: 'x' | 'y') => {
    if (axis === 'x') {
      setAdjustments(prev => ({ ...prev, flipX: !prev.flipX }));
    } else {
      setAdjustments(prev => ({ ...prev, flipY: !prev.flipY }));
    }
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      rotation: 0,
      flipX: false,
      flipY: false
    });
    setActiveFilter('');
    setZoom(1);
  };

  const addTextOverlay = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [...prev, {
      text: newText,
      x: 50,
      y: 50,
      color: '#ffffff',
      size: 24
    }]);
    setNewText('');
  };

  const exportImage = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img) return;
    
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    ctx.filter = getFilterStyle();
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.flipX ? -1 : 1, adjustments.flipY ? -1 : 1);
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
    
    textOverlays.forEach(overlay => {
      ctx.font = `${overlay.size}px Arial`;
      ctx.fillStyle = overlay.color;
      ctx.fillText(overlay.text, (overlay.x / 100) * canvas.width, (overlay.y / 100) * canvas.height);
    });
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited-${imageName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h2 className="text-white font-semibold truncate max-w-xs">{imageName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAdjustments}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <Undo className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={exportImage}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden p-8">
        <div className="relative max-w-full max-h-full">
          <img
            ref={imageRef}
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
            style={{
              filter: getFilterStyle(),
              transform: getTransformStyle()
            }}
          />
          {textOverlays.map((overlay, index) => (
            <div
              key={index}
              className="absolute pointer-events-none"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                color: overlay.color,
                fontSize: `${overlay.size}px`,
                transform: 'translate(-50%, -50%)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {overlay.text}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="text-white hover:text-gray-300 p-2"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="text-white hover:text-gray-300 p-2"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 justify-center">
          {[
            { id: 'adjust', label: 'Adjust', icon: Sun },
            { id: 'filters', label: 'Filters', icon: Palette },
            { id: 'transform', label: 'Transform', icon: Crop },
            { id: 'text', label: 'Text', icon: Type }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 max-w-2xl mx-auto">
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Brightness</span>
                  <span className="text-white">{adjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.brightness}
                  onChange={(e) => handleAdjustmentChange('brightness', parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Contrast</span>
                  <span className="text-white">{adjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.contrast}
                  onChange={(e) => handleAdjustmentChange('contrast', parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Saturation</span>
                  <span className="text-white">{adjustments.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={adjustments.saturation}
                  onChange={(e) => handleAdjustmentChange('saturation', parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="grid grid-cols-5 gap-2">
              {filters.map(filter => (
                <button
                  key={filter.name}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`p-2 rounded-lg transition-colors ${
                    activeFilter === filter.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div 
                    className="w-full aspect-square rounded mb-1 bg-gradient-to-br from-purple-500 to-pink-500"
                    style={{ filter: filter.value || 'none' }}
                  />
                  <span className="text-xs">{filter.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'transform' && (
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => handleRotate('ccw')}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Rotate Left
              </button>
              <button
                onClick={() => handleRotate('cw')}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <RotateCw className="w-5 h-5" />
                Rotate Right
              </button>
              <button
                onClick={() => handleFlip('x')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  adjustments.flipX ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <FlipHorizontal className="w-5 h-5" />
                Flip H
              </button>
              <button
                onClick={() => handleFlip('y')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  adjustments.flipY ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <FlipVertical className="w-5 h-5" />
                Flip V
              </button>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter text..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={addTextOverlay}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Text
                </button>
              </div>
              {textOverlays.length > 0 && (
                <div className="space-y-2">
                  {textOverlays.map((overlay, index) => (
                    <div key={index} className="flex items-center gap-2 text-white text-sm bg-gray-700 rounded p-2">
                      <span className="flex-1">{overlay.text}</span>
                      <button
                        onClick={() => setTextOverlays(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
