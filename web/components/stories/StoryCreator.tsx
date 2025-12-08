'use client';

import { useState, useRef } from 'react';
import { X, Camera, Type, Loader2, Image as ImageIcon } from 'lucide-react';

interface StoryCreatorProps {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}

const LAYER_OPTIONS = [
  { value: 'environment', label: 'Environment', color: 'bg-green-500' },
  { value: 'biological', label: 'Biological', color: 'bg-red-500' },
  { value: 'internal', label: 'Internal', color: 'bg-blue-500' },
  { value: 'cultural', label: 'Cultural', color: 'bg-yellow-500' },
  { value: 'social', label: 'Social', color: 'bg-purple-500' },
  { value: 'conscious', label: 'Conscious', color: 'bg-indigo-500' },
  { value: 'existential', label: 'Existential', color: 'bg-pink-500' },
];

export default function StoryCreator({ userId, onClose, onCreated }: StoryCreatorProps) {
  const [mode, setMode] = useState<'text' | 'media'>('media');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [layer, setLayer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setMediaType(type);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'media');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMediaUrl(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (mode === 'text' && !content.trim()) return;
    if (mode === 'media' && !mediaUrl) return;

    setCreating(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: content.trim() || null,
          mediaUrl,
          mediaType,
          layer
        })
      });

      if (res.ok) {
        onCreated();
      }
    } catch (error) {
      console.error('Story creation failed:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-white font-medium">Create Story</h2>
        <div className="w-10" />
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setMode('media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            mode === 'media' ? 'bg-white text-black' : 'bg-white/20 text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-sm font-medium">Media</span>
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            mode === 'text' ? 'bg-white text-black' : 'bg-white/20 text-white'
          }`}
        >
          <Type className="w-4 h-4" />
          <span className="text-sm font-medium">Text</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {mode === 'media' ? (
          <div className="w-full max-w-md aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden relative">
            {previewUrl ? (
              <>
                {mediaType === 'video' ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setMediaUrl(null);
                    setMediaType(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-sm">Tap to add photo or video</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="w-full max-w-md aspect-[9/16] bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl overflow-hidden flex items-center justify-center p-6">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={280}
              className="w-full h-full bg-transparent text-white text-xl font-medium text-center placeholder-white/50 resize-none focus:outline-none"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {mode === 'media' && previewUrl && (
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a caption..."
            maxLength={280}
            className="w-full px-4 py-3 bg-white/10 text-white rounded-xl placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLayer(layer === opt.value ? null : opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                layer === opt.value
                  ? `${opt.color} text-white`
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={creating || uploading || (mode === 'text' && !content.trim()) || (mode === 'media' && !mediaUrl)}
          className="w-full py-3 bg-white text-black rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sharing...
            </>
          ) : (
            'Share to Story'
          )}
        </button>
      </div>
    </div>
  );
}
