'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X, RotateCcw, Zap, ZapOff, Timer, Gauge, Check, Undo2, Redo2,
  Sparkles, Type, Music, Sticker, Wand2, Camera, Video, ChevronUp, Play, Pause
} from 'lucide-react';

interface Filter {
  id: string;
  name: string;
  style: string;
  thumbnail: string;
}

const FILTERS: Filter[] = [
  { id: 'none', name: 'Normal', style: 'none', thumbnail: 'bg-gray-600' },
  { id: 'vivid', name: 'Vivid', style: 'saturate(1.4) contrast(1.1)', thumbnail: 'bg-pink-500' },
  { id: 'warm', name: 'Warm', style: 'sepia(0.3) saturate(1.2) brightness(1.05)', thumbnail: 'bg-orange-500' },
  { id: 'cool', name: 'Cool', style: 'hue-rotate(-15deg) saturate(1.1) brightness(1.05)', thumbnail: 'bg-blue-500' },
  { id: 'vintage', name: 'Vintage', style: 'sepia(0.5) contrast(1.1) brightness(0.95)', thumbnail: 'bg-green-700' },
  { id: 'noir', name: 'B&W', style: 'grayscale(1) contrast(1.2)', thumbnail: 'bg-gray-800' },
  { id: 'fade', name: 'Fade', style: 'contrast(0.9) brightness(1.1) saturate(0.8)', thumbnail: 'bg-slate-400' },
  { id: 'dramatic', name: 'Drama', style: 'contrast(1.3) saturate(1.2) brightness(0.9)', thumbnail: 'bg-purple-700' },
  { id: 'dreamy', name: 'Dreamy', style: 'brightness(1.1) saturate(0.9) blur(0.3px)', thumbnail: 'bg-pink-300' },
  { id: 'cinematic', name: 'Cinema', style: 'contrast(1.2) saturate(1.1) sepia(0.15)', thumbnail: 'bg-green-600' },
];

const SPEED_OPTIONS = [
  { value: 0.3, label: '0.3x' },
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
];

const TIMER_OPTIONS = [0, 3, 10];

const BEAUTY_LEVELS = [
  { id: 'off', name: 'Off', value: 0 },
  { id: 'natural', name: 'Natural', value: 1 },
  { id: 'smooth', name: 'Smooth', value: 2 },
  { id: 'glamour', name: 'Glamour', value: 3 },
];

interface Segment {
  id: string;
  blob: Blob;
  duration: number;
  thumbnail?: string;
}

interface TikTokCameraProps {
  onClose: () => void;
  onComplete: (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    segments?: Segment[];
  }) => void;
  userId: string | null;
}

export default function TikTokCamera({ onClose, onComplete, userId }: TikTokCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<'photo' | 'video'>('video');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [timer, setTimer] = useState(0);
  const [beautyLevel, setBeautyLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [showSpeedPanel, setShowSpeedPanel] = useState(false);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [showBeautyPanel, setShowBeautyPanel] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDuration = 60;

  const stopAllTracks = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: mode === 'video'
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, [facingMode, mode]);

  useEffect(() => {
    startCamera();
    return () => stopAllTracks();
  }, [startCamera, stopAllTracks]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const flipCamera = async () => {
    setIsFlipping(true);
    await new Promise(resolve => setTimeout(resolve, 150));
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => setIsFlipping(false), 300);
  };

  const toggleFlash = () => {
    setFlashEnabled(prev => !prev);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        try {
          (track as any).applyConstraints({
            advanced: [{ torch: !flashEnabled }]
          });
        } catch (e) {
          console.log('Flash not supported');
        }
      }
    }
  };

  const handleFilterSwipe = (info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && selectedFilter < FILTERS.length - 1) {
      setSelectedFilter(prev => prev + 1);
    } else if (info.offset.x > threshold && selectedFilter > 0) {
      setSelectedFilter(prev => prev - 1);
    }
  };

  const startCountdownThenRecord = () => {
    if (timer === 0) {
      mode === 'photo' ? takePhoto() : startRecording();
    } else {
      setCountdown(timer);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            mode === 'photo' ? takePhoto() : startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const filter = FILTERS[selectedFilter];
      if (filter.style !== 'none') {
        ctx.filter = filter.style;
      }

      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedMedia(dataUrl);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const newSegment: Segment = {
          id: Date.now().toString(),
          blob,
          duration: recordingTime
        };
        setSegments(prev => [...prev, newSegment]);
        setRecordingTime(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (e) {
      console.error('Recording error:', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const undoSegment = () => {
    setSegments(prev => prev.slice(0, -1));
  };

  const handleComplete = async () => {
    if (capturedMedia) {
      onComplete({
        mediaUrl: capturedMedia,
        mediaType: 'image'
      });
    } else if (segments.length > 0) {
      const combinedBlob = new Blob(segments.map(s => s.blob), { type: 'video/webm' });
      const url = URL.createObjectURL(combinedBlob);
      onComplete({
        mediaUrl: url,
        mediaType: 'video',
        segments
      });
    }
  };

  const totalRecordedTime = segments.reduce((sum, s) => sum + s.duration, 0) + recordingTime;
  const progress = (totalRecordedTime / maxDuration) * 100;
  const currentFilter = FILTERS[selectedFilter];

  const getBeautyStyle = () => {
    if (beautyLevel === 0) return {};
    const blur = beautyLevel * 0.3;
    const brightness = 1 + beautyLevel * 0.03;
    return {
      filter: `blur(${blur}px) brightness(${brightness})`
    };
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-4">{error}</p>
          <button onClick={startCamera} className="px-6 py-3 bg-green-600 rounded-xl font-medium mr-3">
            Try Again
          </button>
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 rounded-xl font-medium">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={onClose} className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimerPanel(!showTimerPanel)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${timer > 0 ? 'bg-yellow-500' : 'bg-black/40 backdrop-blur-sm'} text-white`}
          >
            <Timer className="w-5 h-5" />
            {timer > 0 && <span className="absolute text-[10px] font-bold">{timer}s</span>}
          </button>

          <button
            onClick={toggleFlash}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${flashEnabled ? 'bg-yellow-500' : 'bg-black/40 backdrop-blur-sm'} text-white`}
          >
            {flashEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowSpeedPanel(!showSpeedPanel)}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <Gauge className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTimerPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 z-30 bg-black/80 backdrop-blur-md rounded-2xl p-3"
          >
            <div className="flex gap-2">
              {TIMER_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTimer(t); setShowTimerPanel(false); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${timer === t ? 'bg-white text-black' : 'bg-white/20 text-white'}`}
                >
                  {t === 0 ? 'Off' : `${t}s`}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {showSpeedPanel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-4 z-30 bg-black/80 backdrop-blur-md rounded-2xl p-3"
          >
            <div className="flex gap-1">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setSpeed(s.value); setShowSpeedPanel(false); }}
                  className={`px-3 py-2 rounded-full text-xs font-medium ${speed === s.value ? 'bg-white text-black' : 'bg-white/20 text-white'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        <button onClick={flipCamera} className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <motion.div animate={{ rotateY: isFlipping ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <RotateCcw className="w-6 h-6" />
          </motion.div>
        </button>

        <button
          onClick={() => setShowBeautyPanel(!showBeautyPanel)}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${beautyLevel > 0 ? 'bg-pink-500' : 'bg-black/40 backdrop-blur-sm'} text-white`}
        >
          <Wand2 className="w-6 h-6" />
        </button>

        <button
          onClick={() => setShowEffectsPanel(!showEffectsPanel)}
          className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <Sparkles className="w-6 h-6" />
        </button>

        <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <Type className="w-6 h-6" />
        </button>

        <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <Music className="w-6 h-6" />
        </button>

        <button className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
          <Sticker className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {showBeautyPanel && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute right-20 top-1/2 -translate-y-1/2 z-30 bg-black/80 backdrop-blur-md rounded-2xl p-3"
          >
            <p className="text-white text-xs mb-2 font-medium">Beauty</p>
            <div className="flex flex-col gap-2">
              {BEAUTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => { setBeautyLevel(level.value); setShowBeautyPanel(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-left ${beautyLevel === level.value ? 'bg-pink-500 text-white' : 'bg-white/20 text-white'}`}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="flex-1 relative overflow-hidden flex items-center justify-center bg-black"
        onPanEnd={(_, info) => handleFilterSwipe(info)}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
      >
        <div className="w-full max-w-sm aspect-[9/16] relative overflow-hidden bg-black">
          {capturedMedia ? (
            mode === 'photo' ? (
              <img src={capturedMedia} alt="Captured" className="w-full h-full object-cover" />
            ) : (
              <video src={capturedMedia} className="w-full h-full object-cover" controls />
            )
          ) : (
            <motion.video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover bg-black"
              animate={{ 
                rotateY: isFlipping ? 90 : 0,
                scale: isFlipping ? 0.9 : 1
              }}
              transition={{ duration: 0.15 }}
              style={{
                filter: currentFilter.style !== 'none' ? currentFilter.style : undefined,
                ...getBeautyStyle()
              }}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          <AnimatePresence>
            {countdown > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <motion.span
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="text-white text-9xl font-bold"
                >
                  {countdown}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {!capturedMedia && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1">
              {FILTERS.map((filter, index) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedFilter === index ? 'w-4 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {!capturedMedia && selectedFilter > 0 && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-white text-sm font-medium">{currentFilter.name}</span>
            </div>
          )}
        </div>
      </motion.div>

      {mode === 'video' && (
        <div className="absolute bottom-32 left-4 right-4 z-20">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
            {segments.map((seg, i) => {
              const prevWidth = segments.slice(0, i).reduce((sum, s) => sum + (s.duration / maxDuration) * 100, 0);
              return (
                <div
                  key={seg.id}
                  className="absolute top-0 h-full w-0.5 bg-white"
                  style={{ left: `${prevWidth + (seg.duration / maxDuration) * 100}%` }}
                />
              );
            })}
          </div>
          {segments.length > 0 && (
            <div className="flex items-center justify-between mt-2">
              <button onClick={undoSegment} className="flex items-center gap-1 text-white/80 text-xs">
                <Undo2 className="w-4 h-4" />
                Undo
              </button>
              <span className="text-white text-xs">{totalRecordedTime.toFixed(1)}s / {maxDuration}s</span>
            </div>
          )}
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 z-20 pb-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
      >
        {!capturedMedia ? (
          <>
            <div className="flex justify-center gap-8 mb-6">
              <button
                onClick={() => setMode('photo')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === 'photo' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => setMode('video')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === 'video' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Video
              </button>
            </div>

            <div className="flex items-center justify-center gap-8">
              {segments.length > 0 && (
                <button
                  onClick={handleComplete}
                  className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white"
                >
                  <Check className="w-6 h-6" />
                </button>
              )}

              <button
                onClick={isRecording ? stopRecording : startCountdownThenRecord}
                className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                  isRecording ? 'bg-red-500 scale-110' : ''
                }`}
              >
                {mode === 'photo' ? (
                  <div className="w-16 h-16 rounded-full bg-white" />
                ) : isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-8 h-8 rounded bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-500" />
                )}
              </button>

              <div className="w-12" />
            </div>
          </>
        ) : (
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setCapturedMedia(null)}
              className="px-6 py-3 bg-white/20 text-white rounded-full font-medium"
            >
              Retake
            </button>
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-green-600 text-white rounded-full font-medium flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Continue
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
