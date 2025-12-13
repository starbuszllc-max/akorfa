'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Mic, MicOff, Image as ImageIcon, Loader2, MessageCircle, User, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import UserProfileCard from '@/components/messages/UserProfileCard';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  lastMessage: {
    content: string;
    messageType: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
  lastMessageAt: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  audioDuration?: number;
  isRead: boolean;
  createdAt: string;
  sender: {
    username: string;
    avatarUrl?: string;
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    if (uid) {
      fetchConversations(uid);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedConversation && userId) {
      interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedConversation, userId]);

  const fetchConversations = async (uid: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${uid}`);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}&conversationId=${conversationId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !userId || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          receiverId: selectedConversation.otherUser.id,
          content: newMessage.trim(),
          messageType: 'text'
        })
      });

      if (res.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation || !userId) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.webm');
      formData.append('type', 'media');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: userId,
            receiverId: selectedConversation.otherUser.id,
            messageType: 'audio',
            mediaUrl: uploadData.url,
            audioDuration: recordingTime
          })
        });

        fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setSending(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sign up to start messaging other users.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
        >
          Get Started
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden min-h-[70vh] flex">
          <div className={`w-full md:w-96 border-r border-gray-200 dark:border-slate-700 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{conversations.length} conversations</p>
            </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                <div>
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Start following people and send them a message!</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left border-l-4 ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-slate-800">
                        {conv.otherUser.avatarUrl ? (
                          <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-white" />
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-800">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {conv.otherUser.username}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                          {conv.lastMessage.messageType === 'audio' ? '🎵 Voice message' : conv.lastMessage.messageType === 'image' ? '📸 Photo' : conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-white to-indigo-50 dark:from-slate-800 dark:to-slate-700/50 sticky top-0">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden ring-2 ring-indigo-200 dark:ring-indigo-900">
                      {selectedConversation.otherUser.avatarUrl ? (
                        <img src={selectedConversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedConversation.otherUser.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tap to view profile</p>
                    </div>
                  </button>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.senderId === userId
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {msg.messageType === 'audio' && msg.mediaUrl ? (
                        <div className="flex items-center gap-2">
                          <audio src={msg.mediaUrl} controls className="h-8" />
                          {msg.audioDuration && (
                            <span className="text-xs opacity-70">{formatTime(msg.audioDuration)}</span>
                          )}
                        </div>
                      ) : msg.messageType === 'image' && msg.mediaUrl ? (
                        <img src={msg.mediaUrl} alt="" className="max-w-full rounded-lg" />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <p className={`text-xs mt-1 ${msg.senderId === userId ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <>
                      <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Recording... {formatTime(recordingTime)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <MicOff className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {showProfile && selectedConversation && (
      <UserProfileCard
        user={{
          id: selectedConversation.otherUser.id,
          username: selectedConversation.otherUser.username,
          avatarUrl: selectedConversation.otherUser.avatarUrl
        }}
        onClose={() => setShowProfile(false)}
      />
    )}
    </>
  );
}
