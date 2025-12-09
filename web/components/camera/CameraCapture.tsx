'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Video, RotateCcw, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LAYERS = [
  { id: 'environment', label: 'Environment', emoji: '🌍', color: 'from-emerald-500 to-green-600' },
  { id: 'bio', label: 'Biological', emoji: '🧬', color: 'from-rose-500 to-pink-600' },
  { id: 'internal', label: 'Internal', emoji: '🧠', color: 'from-purple-500 to-violet-600' },
  { id: 'cultural', label: 'Cultural', emoji: '🎭', color: 'from-amber-500 to-orange-600' },
  { id: 'social', label: 'Social', emoji: '👥', color: 'from-blue-500 to-cyan-600' },
  { id: 'conscious', label: 'Conscious', emoji: '💭', color: 'from-indigo-500 to-blue-600' },
  { id: 'existential', label: 'Existential', emoji: '✨', color: 'from-violet-500 to-purple-600' },
];

interface CameraCaptureProps {
  onClose: () => void;
  onCapture: (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    layer: string;
    destination: 'feed' | 'story' | 'save';
  }) => void;
  userId: string | null;
}

export default function CameraCapture({ onClose, onCapture, userId }: CameraCaptureProps) {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('social');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [showDestination, setShowDestination] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isClosingRef = useRef(false);

  const stopAllTracks = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping already stopped recorder
      }
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isClosingRef.current) return;
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === 'video'
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (isClosingRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      
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
    
    return () => {
      isClosingRef.current = true;
      stopAllTracks();
    };
  }, []);

  useEffect(() => {
    if (!capturedMedia) {
      startCamera();
    }
  }, [facingMode, mode, capturedMedia, startCamera]);

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    stopAllTracks();
    onClose();
  }, [stopAllTracks, onClose]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedMedia(URL.createObjectURL(blob));
          setShowLayerPicker(true);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setCapturedBlob(blob);
      setCapturedMedia(URL.createObjectURL(blob));
      setShowLayerPicker(true);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retake = () => {
    setCapturedMedia(null);
    setCapturedBlob(null);
    setShowLayerPicker(false);
    setShowDestination(false);
  };

  const flipCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleDestinationSelect = async (destination: 'feed' | 'story' | 'save') => {
    if (!capturedBlob || !userId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', capturedBlob, mode === 'photo' ? 'capture.jpg' : 'capture.webm');
      formData.append('type', 'media');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        onCapture({
          mediaUrl: data.url,
          mediaType: mode === 'photo' ? 'image' : 'video',
          layer: selectedLayer,
          destination
        });
        handleClose();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const currentLayer = LAYERS.find(l => l.id === selectedLayer)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button
          onClick={handleClose}
          className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        {!capturedMedia && (
          <button
            onClick={flipCamera}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 relative">
        {!capturedMedia ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          mode === 'photo' ? (
            <img src={capturedMedia} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video src={capturedMedia} controls className="w-full h-full object-cover" />
          )
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <p className="mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-indigo-600 rounded-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showLayerPicker && !showDestination && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          >
            <p className="text-white text-center mb-4 text-sm">Tag your layer</p>
            <div className="flex gap-2 justify-center flex-wrap mb-6">
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLayer === layer.id
                      ? `bg-gradient-to-r ${layer.color} text-white`
                      : 'bg-white/20 text-white/80 hover:bg-white/30'
                  }`}
                >
                  {layer.emoji} {layer.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={retake}
                className="px-6 py-3 bg-white/20 text-white rounded-full font-medium"
              >
                Retake
              </button>
              <button
                onClick={() => setShowDestination(true)}
                className={`px-6 py-3 bg-gradient-to-r ${currentLayer.color} text-white rounded-full font-medium flex items-center gap-2`}
              >
                <Check className="w-5 h-5" />
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {showDestination && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          >
            <p className="text-white text-center mb-4 text-sm">Share to</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleDestinationSelect('feed')}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-4 bg-white/20 rounded-xl text-white hover:bg-white/30 disabled:opacity-50"
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Feed</span>
              </button>
              <button
                onClick={() => handleDestinationSelect('story')}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-4 bg-white/20 rounded-xl text-white hover:bg-white/30 disabled:opacity-50"
              >
                <Sparkles className="w-8 h-8" />
                <span className="text-sm">Story</span>
              </button>
              <button
                onClick={() => handleDestinationSelect('save')}
                disabled={uploading}
                className="flex flex-col items-center gap-2 p-4 bg-white/20 rounded-xl text-white hover:bg-white/30 disabled:opacity-50"
              >
                <Camera className="w-8 h-8" />
                <span className="text-sm">Save</span>
              </button>
            </div>
            <button
              onClick={() => setShowDestination(false)}
              className="w-full py-3 text-white/70 text-sm"
            >
              Back
            </button>
          </motion.div>
        )}

        {!capturedMedia && !showLayerPicker && (
          <div className="absolute bottom-0 left-0 right-0 p-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            <div className="flex justify-center gap-8 mb-6">
              <button
                onClick={() => setMode('photo')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  mode === 'photo' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => setMode('video')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  mode === 'video' ? 'bg-white text-black' : 'text-white/70'
                }`}
              >
                Video
              </button>
            </div>
            
            <div className="flex justify-center">
              {mode === 'photo' ? (
                <button
                  onClick={takePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${
                    isRecording ? 'bg-red-500' : ''
                  }`}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 rounded bg-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-500" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
