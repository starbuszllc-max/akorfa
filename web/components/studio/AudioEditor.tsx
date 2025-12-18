'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward,
  Scissors, Volume2, VolumeX,
  ChevronLeft, Download,
  Mic, Square, Clock
} from 'lucide-react';

interface AudioEditorProps {
  audioUrl: string;
  audioName: string;
  onClose: () => void;
  onSave?: (editedBlob: Blob) => void;
}

interface TrimRange {
  start: number;
  end: number;
}

export default function AudioEditor({ audioUrl, audioName, onClose, onSave }: AudioEditorProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [activeTab, setActiveTab] = useState<'trim' | 'speed' | 'effects'>('trim');
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setTrimRange({ start: 0, end: audio.duration });
      generateWaveform();
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const generateWaveform = async () => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      const max = Math.max(...waveform);
      setWaveformData(waveform.map(v => v / max));
      audioContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
      setWaveformData(Array(200).fill(0.5));
    }
  };

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration));
  }, [duration]);

  const skipForward = () => seek(currentTime + 5);
  const skipBackward = () => seek(currentTime - 5);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setPlaybackRate(speed);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    seek(percentage * duration);
  };

  const handleTrimChange = (type: 'start' | 'end', value: number) => {
    setTrimRange(prev => ({
      ...prev,
      [type]: value
    }));
    if (type === 'start') {
      seek(value);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportAudio = async () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `edited-${audioName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <audio ref={audioRef} src={audioUrl} />

      <div className="flex items-center justify-between p-4 bg-gray-900">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h2 className="text-white font-semibold truncate max-w-xs">{audioName}</h2>
        <button
          onClick={exportAudio}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-8">
        <div className="w-full max-w-4xl">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-center gap-6 mb-8">
              <Mic className="w-16 h-16 text-white/80" />
            </div>
            
            <div
              className="h-32 flex items-center gap-0.5 cursor-pointer rounded-lg overflow-hidden bg-black/20 p-2"
              onClick={handleWaveformClick}
            >
              {waveformData.map((value, index) => {
                const percentage = (index / waveformData.length) * 100;
                const isPlayed = (currentTime / duration) * 100 >= percentage;
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-full transition-colors ${
                      isPlayed ? 'bg-white' : 'bg-white/40'
                    }`}
                    style={{ height: `${value * 100}%` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button onClick={skipBackward} className="text-white hover:text-gray-300 p-2">
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </button>
            <button onClick={skipForward} className="text-white hover:text-gray-300 p-2">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-white text-sm mb-6">
            <span className="font-mono w-16">{formatTime(currentTime)}</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative" onClick={handleWaveformClick}>
              <div
                className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <span className="font-mono w-16 text-right">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={toggleMute} className="text-white hover:text-gray-300">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32 accent-green-500"
            />
            <span className="text-gray-400 text-sm">{playbackRate}x</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-4">
        <div className="flex gap-2 mb-4 justify-center">
          {[
            { id: 'trim', label: 'Trim', icon: Scissors },
            { id: 'speed', label: 'Speed', icon: Clock },
            { id: 'effects', label: 'Effects', icon: Volume2 }
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
          {activeTab === 'trim' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-gray-400 text-sm mb-1 block">Start Time</label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimRange.start}
                    onChange={(e) => handleTrimChange('start', parseFloat(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <span className="text-white text-sm font-mono">{formatTime(trimRange.start)}</span>
                </div>
                <div className="flex-1">
                  <label className="text-gray-400 text-sm mb-1 block">End Time</label>
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={trimRange.end}
                    onChange={(e) => handleTrimChange('end', parseFloat(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <span className="text-white text-sm font-mono">{formatTime(trimRange.end)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speed' && (
            <div className="grid grid-cols-3 gap-2">
              {speedOptions.map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`py-3 rounded-lg font-medium transition-colors ${
                    playbackRate === speed
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-green-500"
                />
                <span className="text-gray-400 text-sm">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  Noise Reduction
                </button>
                <button className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  Normalize
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
