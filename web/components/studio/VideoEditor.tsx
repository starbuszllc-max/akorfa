'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward,
  Scissors, RotateCcw, RotateCw,
  Volume2, VolumeX, Maximize,
  ZoomIn, ZoomOut, Mic,
  Clock, Crop, FlipHorizontal,
  ChevronLeft, Download, Share2,
  Undo, Redo, Layers
} from 'lucide-react';

interface VideoEditorProps {
  videoUrl: string;
  videoName: string;
  onClose: () => void;
  onSave?: (editedBlob: Blob) => void;
}

interface TrimRange {
  start: number;
  end: number;
}

export default function VideoEditor({ videoUrl, videoName, onClose, onSave }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState<'trim' | 'speed' | 'transform' | 'audio'>('trim');
  const [isRecordingVoiceover, setIsRecordingVoiceover] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setTrimRange({ start: 0, end: video.duration });
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
  }, [duration]);

  const skipForward = () => seek(currentTime + 5);
  const skipBackward = () => seek(currentTime - 5);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackRate(speed);
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation(prev => prev + (direction === 'cw' ? 90 : -90));
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const exportVideo = async () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `edited-${videoName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

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
        <h2 className="text-white font-semibold truncate max-w-xs">{videoName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportVideo}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-950 overflow-hidden">
        <div
          className="relative max-w-full max-h-full"
          style={{
            transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
            transition: 'transform 0.3s ease'
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-[60vh] object-contain"
            playsInline
            onClick={togglePlay}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 p-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={skipBackward} className="text-white hover:text-gray-300">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button onClick={skipForward} className="text-white hover:text-gray-300">
            <SkipForward className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 text-white text-sm">
            <span className="font-mono">{formatTime(currentTime)}</span>
            <div
              ref={timelineRef}
              className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
              />
            </div>
            <span className="font-mono">{formatTime(duration)}</span>
          </div>

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
            className="w-20 accent-green-500"
          />
          <span className="text-white text-sm font-mono">{playbackRate}x</span>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { id: 'trim', label: 'Trim', icon: Scissors },
            { id: 'speed', label: 'Speed', icon: Clock },
            { id: 'transform', label: 'Transform', icon: Crop },
            { id: 'audio', label: 'Audio', icon: Volume2 }
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

        <div className="bg-gray-800 rounded-lg p-4">
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
              <p className="text-gray-500 text-sm">
                Trimmed duration: {formatTime(trimRange.end - trimRange.start)}
              </p>
            </div>
          )}

          {activeTab === 'speed' && (
            <div className="grid grid-cols-4 gap-2">
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

          {activeTab === 'transform' && (
            <div className="flex flex-wrap gap-3">
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
                onClick={handleFlip}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isFlipped ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <FlipHorizontal className="w-5 h-5" />
                Flip
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Video Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-green-500"
                />
              </div>
              <button
                onClick={() => setIsRecordingVoiceover(!isRecordingVoiceover)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isRecordingVoiceover
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isRecordingVoiceover ? 'Recording Voiceover...' : 'Add Voiceover'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
