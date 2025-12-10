'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Play, Pause, Upload, Music, Plus, Loader2, Check, Volume2 } from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  category: 'trending' | 'royalty-free' | 'uploaded';
  thumbnail?: string;
}

const SAMPLE_TRACKS: Track[] = [
  { id: '1', title: 'Upbeat Energy', artist: 'Akorfa Beats', duration: 30, url: '', category: 'royalty-free' },
  { id: '2', title: 'Chill Vibes', artist: 'Akorfa Beats', duration: 45, url: '', category: 'royalty-free' },
  { id: '3', title: 'Motivation Flow', artist: 'Akorfa Beats', duration: 60, url: '', category: 'royalty-free' },
  { id: '4', title: 'Happy Day', artist: 'Akorfa Beats', duration: 30, url: '', category: 'trending' },
  { id: '5', title: 'Deep Focus', artist: 'Akorfa Beats', duration: 120, url: '', category: 'trending' },
  { id: '6', title: 'Summer Dance', artist: 'Akorfa Beats', duration: 45, url: '', category: 'trending' },
];

interface MusicPickerProps {
  selectedTrack: Track | null;
  onSelect: (track: Track | null) => void;
  onClose: () => void;
}

export default function MusicPicker({ selectedTrack, onSelect, onClose }: MusicPickerProps) {
  const [tab, setTab] = useState<'trending' | 'royalty-free' | 'uploaded'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>(SAMPLE_TRACKS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedTracks, setUploadedTracks] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const filteredTracks = tracks.filter(track => {
    const matchesTab = tab === 'uploaded' ? uploadedTracks.some(t => t.id === track.id) : track.category === tab;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && (searchQuery ? matchesSearch : true);
  });

  const handlePlayPause = (track: Track) => {
    if (playingId === track.id) {
      setPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingId(track.id);
      if (audioRef.current && track.url) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio(objectUrl);
      
      audio.onloadedmetadata = () => {
        const newTrack: Track = {
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'My Upload',
          duration: Math.round(audio.duration),
          url: objectUrl,
          category: 'uploaded'
        };
        setUploadedTracks(prev => [...prev, newTrack]);
        setTracks(prev => [...prev, newTrack]);
        setTab('uploaded');
        setUploading(false);
      };

      audio.onerror = () => {
        setUploading(false);
        alert('Failed to load audio file');
      };
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
    }
  };

  const handleSelect = (track: Track) => {
    onSelect(selectedTrack?.id === track.id ? null : track);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col"
    >
      <audio ref={audioRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Music className="w-6 h-6 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Add Sound</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sounds..."
            className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-2 px-3 mb-3">
        <button
          onClick={() => setTab('trending')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            tab === 'trending' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setTab('royalty-free')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            tab === 'royalty-free' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Royalty Free
        </button>
        <button
          onClick={() => setTab('uploaded')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            tab === 'uploaded' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          My Sounds
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-safe">
        {tab === 'uploaded' && uploadedTracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-white" />
              )}
            </button>
            <p className="text-white font-medium mb-1">Upload your music</p>
            <p className="text-gray-500 text-sm">MP3, WAV, M4A supported</p>
          </div>
        )}

        <div className="space-y-2">
          {filteredTracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                selectedTrack?.id === track.id ? 'bg-indigo-600/30 border border-indigo-500' : 'bg-gray-800 hover:bg-gray-750'
              }`}
            >
              <button
                onClick={() => handlePlayPause(track)}
                className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0"
              >
                {playingId === track.id ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{track.title}</p>
                <p className="text-gray-400 text-sm">{track.artist} • {formatDuration(track.duration)}</p>
              </div>

              <button
                onClick={() => handleSelect(track)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  selectedTrack?.id === track.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {selectedTrack?.id === track.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {tab === 'uploaded' && uploadedTracks.length > 0 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:border-gray-600 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            Upload more
          </button>
        )}
      </div>

      {selectedTrack && (
        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{selectedTrack.title}</p>
              <p className="text-gray-400 text-sm">{selectedTrack.artist}</p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="px-4 py-2 text-red-400 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
