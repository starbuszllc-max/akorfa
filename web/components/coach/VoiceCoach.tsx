'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Send } from 'lucide-react';

interface VoiceCoachProps {
  userId: string | null;
  onMessage?: (message: string, response: string) => void;
}

export function VoiceCoach({ userId, onMessage }: VoiceCoachProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);
          
          if (event.results[current].isFinal) {
            handleSendMessage(transcriptText);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError('Speech recognition error. Please try again.');
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.response) {
        setResponse(data.response);
        onMessage?.(message.trim(), data.response);

        if (audioEnabled && synthRef.current) {
          speakResponse(data.response);
        }
      }
    } catch (err) {
      console.error('Voice coach error:', err);
      setError('Failed to get response. Please try again.');
    }

    setIsProcessing(false);
  };

  const speakResponse = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Voice AI Coach
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tap the microphone and speak to your AI coach
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative flex flex-col items-center gap-3">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white shadow-lg disabled:opacity-50`}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </button>
          
          {isListening && (
            <>
              <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-red-400 animate-ping" />
              <button
                onClick={() => {
                  if (recognitionRef.current) {
                    recognitionRef.current.abort();
                  }
                  setIsListening(false);
                  setTranscript('');
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-full text-sm font-semibold shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <MicOff className="w-4 h-4" />
                Stop Recording
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-full transition-all ${
              audioEnabled
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-400'
            }`}
            title={audioEnabled ? 'Disable audio response' : 'Enable audio response'}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium"
            >
              Stop Speaking
            </button>
          )}
        </div>

        {transcript && (
          <div className="w-full bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">You said:</div>
            <p className="text-gray-900 dark:text-white">{transcript}</p>
          </div>
        )}

        {response && (
          <div className="w-full bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Coach response:</div>
            <p className="text-gray-900 dark:text-white">{response}</p>
          </div>
        )}

        {error && (
          <div className="w-full bg-red-50 dark:bg-red-900/30 rounded-xl p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {isListening ? 'Listening... Speak now' : 'Tap the microphone to start'}
        </p>
      </div>
    </div>
  );
}
