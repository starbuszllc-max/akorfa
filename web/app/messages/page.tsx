'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ArrowLeft, Mic, MicOff, Image as ImageIcon, Loader2, MessageCircle, User, MoreVertical, Check, CheckCheck, Phone, Video, Search, Smile, Paperclip, Camera } from 'lucide-react';
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

function MessagesContent() {
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');
  
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
  const [newChatUser, setNewChatUser] = useState<{ id: string; username: string; avatarUrl?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (targetUserId && userId && conversations.length >= 0 && !loading) {
      const existingConv = conversations.find(c => c.otherUser.id === targetUserId);
      if (existingConv) {
        setSelectedConversation(existingConv);
        fetchMessages(existingConv.id);
      } else if (targetUserId !== userId) {
        fetchNewChatUser(targetUserId);
      }
    }
  }, [targetUserId, userId, conversations, loading]);

  const fetchNewChatUser = async (uid: string) => {
    try {
      const res = await fetch(`/api/profiles?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setNewChatUser({
            id: data.profile.id,
            username: data.profile.username,
            avatarUrl: data.profile.avatarUrl
          });
          setSelectedConversation({
            id: 'new',
            otherUser: {
              id: data.profile.id,
              username: data.profile.username,
              avatarUrl: data.profile.avatarUrl
            },
            lastMessage: null,
            unreadCount: 0,
            lastMessageAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedConversation && userId && selectedConversation.id !== 'new') {
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
    if (conversationId === 'new') return;
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
    setNewChatUser(null);
    if (conv.id !== 'new') {
      fetchMessages(conv.id);
    }
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
        const data = await res.json();
        setNewMessage('');
        
        if (selectedConversation.id === 'new' && data.conversationId) {
          await fetchConversations(userId);
          const newConv = {
            ...selectedConversation,
            id: data.conversationId
          };
          setSelectedConversation(newConv);
          setNewChatUser(null);
          fetchMessages(data.conversationId);
        } else {
          fetchMessages(selectedConversation.id);
        }
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

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const isConsecutiveMessage = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return false;
    if (currentMsg.senderId !== prevMsg.senderId) return false;
    const timeDiff = new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
    return timeDiff < 60000;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sign up to start messaging other users.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
        >
          Get Started
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] safe-area-top pt-4">
        <div className="h-full flex">
          
          <div className={`w-full md:w-[380px] flex flex-col bg-white dark:bg-slate-900 ${selectedConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white"
                />
              </div>
            </div>
          
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                  <div>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium">No conversations yet</p>
                    <p className="text-sm mt-2 text-gray-400">Start following people and send them a message!</p>
                  </div>
                </div>
              ) : (
                <div>
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left ${
                        selectedConversation?.id === conv.id 
                          ? 'bg-gray-100 dark:bg-slate-800' 
                          : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
                          {conv.otherUser.avatarUrl ? (
                            <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {conv.otherUser.username}
                          </span>
                          <span className={`text-xs flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-green-500 font-semibold' : 'text-gray-400'}`}>
                            {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {conv.lastMessage && conv.lastMessage.senderId === userId && (
                            <CheckCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                          {conv.lastMessage && (
                            <p className={`text-sm truncate flex-1 ${conv.unreadCount > 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                              {conv.lastMessage.messageType === 'audio' ? '🎵 Voice message' : conv.lastMessage.messageType === 'image' ? '📸 Photo' : conv.lastMessage.content}
                            </p>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`flex-1 flex flex-col bg-[#e5ddd5] dark:bg-slate-800 ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <>
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
                          {selectedConversation.otherUser.avatarUrl ? (
                            <img src={selectedConversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-50 dark:border-slate-900" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {selectedConversation.otherUser.username}
                        </p>
                        <p className="text-xs text-green-500">online</p>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-y-auto px-4 py-2"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                  }}
                >
                  {messages.length === 0 && selectedConversation.id === 'new' && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          {selectedConversation.otherUser.avatarUrl ? (
                            <img src={selectedConversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedConversation.otherUser.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Start a conversation</p>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDate = shouldShowDateSeparator(msg, prevMsg);
                    const isConsecutive = isConsecutiveMessage(msg, prevMsg);
                    const isMe = msg.senderId === userId;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="px-4 py-1.5 bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-full text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                              {formatDateSeparator(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}>
                          <div
                            className={`relative max-w-[75%] px-3 py-2 shadow-sm ${
                              isMe
                                ? 'bg-[#dcf8c6] dark:bg-green-700 rounded-2xl rounded-tr-sm'
                                : 'bg-white dark:bg-slate-700 rounded-2xl rounded-tl-sm'
                            }`}
                          >
                            {msg.messageType === 'audio' && msg.mediaUrl ? (
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Mic className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <audio src={msg.mediaUrl} controls className="w-full h-8" />
                                  {msg.audioDuration && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(msg.audioDuration)}</span>
                                  )}
                                </div>
                              </div>
                            ) : msg.messageType === 'image' && msg.mediaUrl ? (
                              <div className="rounded-lg overflow-hidden -m-1">
                                <img src={msg.mediaUrl} alt="" className="max-w-full max-h-[300px] object-cover" />
                              </div>
                            ) : (
                              <p className={`text-[15px] leading-relaxed ${isMe ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                                {msg.content}
                              </p>
                            )}
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[11px] ${isMe ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                msg.isRead ? (
                                  <CheckCheck className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 rounded-full">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Recording... {formatTime(recordingTime)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                          <Smile className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                          <Paperclip className="w-6 h-6" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message"
                            className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white text-[15px]"
                          />
                        </div>
                        {newMessage.trim() ? (
                          <button
                            type="submit"
                            disabled={sending}
                            className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50"
                          >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg"
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-800">
                <div className="text-center max-w-md px-8">
                  <div className="w-[200px] h-[200px] mx-auto mb-8 opacity-60">
                    <svg viewBox="0 0 303 172" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M229.565 160.229C262.212 149.245 286.931 118.241 283.39 73.4194C278.009 5.31929 212.365 -11.5738 171.472 8.48673C115.998 37.0182 41.706 24.5765 22.1979 69.8712C2.68967 115.166 24.4655 135.141 65.0847 160.229" stroke="#25D366" strokeWidth="2"/>
                      <path d="M151.5 122C180.495 122 204 98.495 204 69.5C204 40.505 180.495 17 151.5 17C122.505 17 99 40.505 99 69.5C99 98.495 122.505 122 151.5 122Z" fill="#25D366" fillOpacity="0.1"/>
                      <path d="M151.5 89C162.27 89 171 80.2696 171 69.5C171 58.7304 162.27 50 151.5 50C140.73 50 132 58.7304 132 69.5C132 80.2696 140.73 89 151.5 89Z" fill="#25D366"/>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light text-gray-700 dark:text-gray-200 mb-4">Akorfa Messages</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Send and receive messages with other Akorfa users. Select a conversation or start a new one from someone's profile.
                  </p>
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

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-green-500" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
