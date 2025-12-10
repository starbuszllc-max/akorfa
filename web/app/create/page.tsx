'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import TikTokCamera from '@/components/camera/TikTokCamera';
import VideoEditor from '@/components/camera/VideoEditor';
import { Camera, Type, Image, Video, X, Sparkles, Loader2, Send } from 'lucide-react';

type EditorStep = 'menu' | 'camera' | 'editor' | 'caption';

interface EditedMedia {
  url: string;
  type: 'image' | 'video';
  textOverlays: any[];
  stickers: any[];
  music: any | null;
}

const LAYER_OPTIONS = [
  { id: 'environment', label: 'Environment', emoji: '🌍', color: 'bg-emerald-500' },
  { id: 'bio', label: 'Biological', emoji: '🧬', color: 'bg-rose-500' },
  { id: 'internal', label: 'Internal', emoji: '🧠', color: 'bg-purple-500' },
  { id: 'cultural', label: 'Cultural', emoji: '🎭', color: 'bg-amber-500' },
  { id: 'social', label: 'Social', emoji: '👥', color: 'bg-blue-500' },
  { id: 'conscious', label: 'Conscious', emoji: '💭', color: 'bg-indigo-500' },
  { id: 'existential', label: 'Existential', emoji: '✨', color: 'bg-violet-500' },
];

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<EditorStep>('menu');
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [editedMedia, setEditedMedia] = useState<EditedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedLayer, setSelectedLayer] = useState('social');
  const [posting, setPosting] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('demo_user_id') : null;

  const handleCameraComplete = (data: { mediaUrl: string; mediaType: 'image' | 'video' }) => {
    setCapturedMedia({ url: data.mediaUrl, type: data.mediaType });
    setStep('editor');
  };

  const handleEditorComplete = (data: EditedMedia) => {
    setEditedMedia(data);
    setStep('caption');
    generateAICaptions();
  };

  const generateAICaptions = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch('/api/ai-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate 3 creative, engaging captions for a social media post in the ${selectedLayer} layer of the Human Stack. Each caption should be 1-2 sentences, inspiring and authentic. Return only the captions as a JSON array of strings.`,
          type: 'captions'
        })
      });

      if (res.ok) {
        const data = await res.json();
        try {
          const parsed = JSON.parse(data.response || '[]');
          setAiSuggestions(Array.isArray(parsed) ? parsed : []);
        } catch {
          setAiSuggestions([
            `Sharing my ${selectedLayer} journey today ✨`,
            `Growth happens one step at a time 🌱`,
            `Embracing the process 💪`
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to generate captions:', error);
      setAiSuggestions([
        `Sharing my ${selectedLayer} journey today ✨`,
        `Growth happens one step at a time 🌱`,
        `Embracing the process 💪`
      ]);
    }
    setGeneratingCaption(false);
  };

  const handlePost = async () => {
    if (!userId) {
      router.push('/onboarding');
      return;
    }

    if (!caption.trim() && !editedMedia) return;

    setPosting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          content: caption.trim() || 'Check out my post!',
          layer: selectedLayer,
          media_urls: editedMedia ? [editedMedia.url] : [],
          media_types: editedMedia ? [editedMedia.type] : [],
          metadata: editedMedia ? {
            textOverlays: editedMedia.textOverlays,
            stickers: editedMedia.stickers,
            music: editedMedia.music
          } : undefined
        })
      });

      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Error posting:', err);
    }
    setPosting(false);
  };

  if (step === 'camera') {
    return (
      <AnimatePresence>
        <TikTokCamera
          onClose={() => setStep('menu')}
          onComplete={handleCameraComplete}
          userId={userId}
        />
      </AnimatePresence>
    );
  }

  if (step === 'editor' && capturedMedia) {
    return (
      <AnimatePresence>
        <VideoEditor
          mediaUrl={capturedMedia.url}
          mediaType={capturedMedia.type}
          onComplete={handleEditorComplete}
          onBack={() => {
            setCapturedMedia(null);
            setStep('camera');
          }}
        />
      </AnimatePresence>
    );
  }

  if (step === 'caption') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <div
          className="flex items-center justify-between p-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
        >
          <button
            onClick={() => setStep('editor')}
            className="text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">Create Post</h1>
          <button
            onClick={handlePost}
            disabled={posting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Post
          </button>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-6">
          <div className="flex gap-4">
            {editedMedia && (
              <div className="w-24 h-32 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                {editedMedia.type === 'video' ? (
                  <video src={editedMedia.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={editedMedia.url} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none"
              rows={4}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-medium">AI Suggestions</span>
              {generatingCaption && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
            </div>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setCaption(suggestion)}
                  className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-gray-300 text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-3">Tag your layer</p>
            <div className="flex gap-2 flex-wrap">
              {LAYER_OPTIONS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    selectedLayer === layer.id
                      ? `${layer.color} text-white`
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  <span>{layer.emoji}</span>
                  <span>{layer.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create</h1>
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setStep('camera')}
          className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform text-white shadow-lg"
        >
          <Camera className="w-12 h-12" />
          <span className="font-medium">Camera</span>
        </button>

        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                const type = file.type.startsWith('video') ? 'video' : 'image';
                setCapturedMedia({ url, type: type as 'image' | 'video' });
                setStep('editor');
              }
            };
            input.click();
          }}
          className="aspect-square bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform text-white shadow-lg"
        >
          <Image className="w-12 h-12" />
          <span className="font-medium">Gallery</span>
        </button>

        <button
          onClick={() => {
            setStep('caption');
            setEditedMedia(null);
          }}
          className="aspect-square bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform text-white shadow-lg"
        >
          <Type className="w-12 h-12" />
          <span className="font-medium">Text Post</span>
        </button>

        <button
          onClick={() => setStep('camera')}
          className="aspect-square bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform text-white shadow-lg"
        >
          <Video className="w-12 h-12" />
          <span className="font-medium">Story</span>
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-slate-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="font-medium text-gray-900 dark:text-white">Pro Tips</span>
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Use filters to enhance your content</li>
          <li>• Add text overlays to tell your story</li>
          <li>• Include music to boost engagement</li>
          <li>• Tag the right layer for better discovery</li>
        </ul>
      </div>
    </div>
  );
}
