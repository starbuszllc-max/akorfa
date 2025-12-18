'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Mic, MicOff, Image, Video, Music, 
  FolderOpen, Trash2, Play, Pause, Square,
  Volume2, Clock, FileType, X, Check, Edit3, HardDrive
} from 'lucide-react';
import { VideoEditor, AudioEditor, PhotoEditor } from '@/components/studio';
import { saveMediaFile, loadMediaFiles, deleteMediaFile as deleteFromStorage, getStorageUsage } from '@/lib/mediaStorage';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'video' | 'audio' | 'image';
  name: string;
  size: number;
  duration?: number;
  thumbnail?: string;
  createdAt: Date;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export default function StudioPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'library'>('upload');
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });
  const [dragActive, setDragActive] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number }>({ used: 0, available: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  useEffect(() => {
    const loadStoredMedia = async () => {
      try {
        const stored = await loadMediaFiles();
        setMediaFiles(stored);
        const usage = await getStorageUsage();
        setStorageInfo(usage);
      } catch (error) {
        console.error('Error loading media from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredMedia();
  }, []);

  const updateStorageInfo = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageInfo(usage);
    } catch (error) {
      console.error('Error getting storage info:', error);
    }
  };

  const getMediaType = (file: File): 'video' | 'audio' | 'image' => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'image';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const validTypes = ['video/', 'audio/', 'image/'];
    const maxSize = 500 * 1024 * 1024;

    for (const file of Array.from(files)) {
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        console.warn(`Skipped ${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > maxSize) {
        console.warn(`Skipped ${file.name}: file too large (max 500MB)`);
        continue;
      }

      const mediaFile: MediaFile = {
        id: generateId(),
        file,
        url: URL.createObjectURL(file),
        type: getMediaType(file),
        name: file.name,
        size: file.size,
        createdAt: new Date()
      };

      const addAndSave = async (mf: MediaFile) => {
        setMediaFiles(prev => [...prev, mf]);
        try {
          await saveMediaFile({ id: mf.id, file: mf.file, type: mf.type, duration: mf.duration });
          updateStorageInfo();
        } catch (error) {
          console.error('Error saving to storage:', error);
        }
      };

      if (mediaFile.type === 'video' || mediaFile.type === 'audio') {
        const media = document.createElement(mediaFile.type === 'video' ? 'video' : 'audio');
        media.src = mediaFile.url;
        media.onloadedmetadata = () => {
          mediaFile.duration = media.duration;
          addAndSave(mediaFile);
        };
        media.onerror = () => {
          addAndSave(mediaFile);
        };
      } else {
        addAndSave(mediaFile);
      }
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const mediaFile: MediaFile = {
          id: generateId(),
          file: audioFile,
          url: URL.createObjectURL(audioBlob),
          type: 'audio',
          name: audioFile.name,
          size: audioBlob.size,
          duration: recording.duration,
          createdAt: new Date()
        };
        
        setMediaFiles(prev => [...prev, mediaFile]);
        stream.getTracks().forEach(track => track.stop());
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        try {
          await saveMediaFile({ id: mediaFile.id, file: audioFile, type: 'audio', duration: mediaFile.duration });
          updateStorageInfo();
        } catch (error) {
          console.error('Error saving recording to storage:', error);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setRecording({ isRecording: true, isPaused: false, duration: 0, audioLevel: 0 });
      
      recordingTimerRef.current = setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setRecording(prev => ({ ...prev, audioLevel: average / 255 }));
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording.isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecording({ isRecording: false, isPaused: false, duration: 0, audioLevel: 0 });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording.isRecording && !recording.isPaused) {
      mediaRecorderRef.current.pause();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecording(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recording.isPaused) {
      mediaRecorderRef.current.resume();
      recordingTimerRef.current = setInterval(() => {
        setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      setRecording(prev => ({ ...prev, isPaused: false }));
    }
  };

  const deleteFile = async (id: string) => {
    const file = mediaFiles.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
    setMediaFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    try {
      await deleteFromStorage(id);
      updateStorageInfo();
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }
  };

  const getStorageUsed = (): number => {
    return mediaFiles.reduce((total, file) => total + file.size, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
            Media Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload, record, and edit your media
          </p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'record', label: 'Record', icon: Mic },
            { id: 'library', label: 'Library', icon: FolderOpen }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-8 border-2 border-dashed transition-colors ${
                    dragActive
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,audio/*,image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Drop files here or click to upload
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Supports videos, audio files, and images up to 500MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Select Files
                    </button>
                  </div>

                  <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Video className="w-5 h-5" />
                      <span className="text-sm">Video</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Music className="w-5 h-5" />
                      <span className="text-sm">Audio</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Image className="w-5 h-5" />
                      <span className="text-sm">Images</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'record' && (
                <motion.div
                  key="record"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-8"
                >
                  <div className="text-center">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${
                      recording.isRecording
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      {recording.isRecording ? (
                        <div className="relative">
                          <div 
                            className="absolute inset-0 rounded-full bg-red-500 animate-ping"
                            style={{ opacity: recording.audioLevel * 0.5 }}
                          />
                          <Mic className="w-16 h-16 text-red-600 relative z-10" />
                        </div>
                      ) : (
                        <Mic className="w-16 h-16 text-green-600" />
                      )}
                    </div>

                    {recording.isRecording && (
                      <div className="mb-6">
                        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white mb-2">
                          {formatDuration(recording.duration)}
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-xs mx-auto">
                          <div 
                            className="h-full bg-red-500 transition-all duration-100"
                            style={{ width: `${recording.audioLevel * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {recording.isPaused ? 'Paused' : 'Recording...'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4">
                      {!recording.isRecording ? (
                        <button
                          onClick={startRecording}
                          className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                        >
                          <Mic className="w-5 h-5" />
                          Start Recording
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={recording.isPaused ? resumeRecording : pauseRecording}
                            className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            {recording.isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                          </button>
                          <button
                            onClick={stopRecording}
                            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <Square className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </div>

                    {!recording.isRecording && (
                      <p className="text-gray-500 dark:text-gray-400 mt-6">
                        Record voiceovers, podcasts, or audio notes
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Your Media ({mediaFiles.length} files)
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(getStorageUsed())} used
                    </span>
                  </div>

                  {mediaFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No media files yet. Upload or record to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mediaFiles.map(file => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 cursor-pointer ${
                            selectedFile?.id === file.id ? 'ring-2 ring-green-500' : ''
                          }`}
                          onClick={() => setSelectedFile(file)}
                        >
                          {file.type === 'image' ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full aspect-square object-cover"
                            />
                          ) : file.type === 'video' ? (
                            <div className="w-full aspect-square bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                              <video
                                src={file.url}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Music className="w-12 h-12 text-white" />
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate">{file.name}</p>
                            <div className="flex items-center justify-between text-white/70 text-xs">
                              <span>{formatFileSize(file.size)}</span>
                              {file.duration && <span>{formatDuration(file.duration)}</span>}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
              
              {selectedFile ? (
                <div>
                  {selectedFile.type === 'image' ? (
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="w-full rounded-lg mb-4"
                    />
                  ) : selectedFile.type === 'video' ? (
                    <video
                      src={selectedFile.url}
                      controls
                      className="w-full rounded-lg mb-4"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-8 mb-4">
                      <audio
                        src={selectedFile.url}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Name</span>
                      <span className="text-gray-900 dark:text-white truncate ml-2">{selectedFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Type</span>
                      <span className="text-gray-900 dark:text-white capitalize">{selectedFile.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Size</span>
                      <span className="text-gray-900 dark:text-white">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    {selectedFile.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Duration</span>
                        <span className="text-gray-900 dark:text-white">{formatDuration(selectedFile.duration)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button 
                      onClick={() => setEditingFile(selectedFile)}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Media
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileType className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a file to preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingFile && editingFile.type === 'video' && (
        <VideoEditor
          videoUrl={editingFile.url}
          videoName={editingFile.name}
          onClose={() => setEditingFile(null)}
        />
      )}

      {editingFile && editingFile.type === 'audio' && (
        <AudioEditor
          audioUrl={editingFile.url}
          audioName={editingFile.name}
          onClose={() => setEditingFile(null)}
        />
      )}

      {editingFile && editingFile.type === 'image' && (
        <PhotoEditor
          imageUrl={editingFile.url}
          imageName={editingFile.name}
          onClose={() => setEditingFile(null)}
        />
      )}
    </div>
  );
}
