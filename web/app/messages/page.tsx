'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ArrowLeft, Mic, MicOff, Image as ImageIcon, Loader2, MessageCircle, User, MoreVertical, Check, CheckCheck, Phone, Video, Search, Smile, Paperclip, Camera, X, Trash2, VolumeX, Ban, Flag, Copy, Reply, Plus } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import UserProfileCard from '@/components/messages/UserProfileCard';
import StoryViewer from '@/components/stories/StoryViewer';
import StoryCreator from '@/components/stories/StoryCreator';
import CameraCapture from '@/components/camera/CameraCapture';

const EmojiPicker = dynamic(() => import('emoji-picker-react').then(mod => mod.default), { ssr: false });

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

interface Story {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  layer: string | null;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    fullName: string | null;
  };
  stories: Story[];
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<StoryGroup | null>(null);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [viewedStoryTimestamps, setViewedStoryTimestamps] = useState<Record<string, string>>({});
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const uid = localStorage.getItem('demo_user_id');
    setUserId(uid);
    if (uid) {
      fetchConversations(uid);
      fetchStories();
      const savedViewedStories = localStorage.getItem(`viewed_story_timestamps_${uid}`);
      if (savedViewedStories) {
        try {
          setViewedStoryTimestamps(JSON.parse(savedViewedStories));
        } catch (e) {
          console.error('Failed to parse viewed stories:', e);
        }
      }
    } else {
      setLoading(false);
      setStoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (userId) {
        fetchStories();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const data = await res.json();
        setStoryGroups(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleStoryCreated = () => {
    setShowStoryCreator(false);
    fetchStories();
  };

  const handleNextStoryGroup = () => {
    if (selectedStoryGroup && selectedStoryGroup.stories.length > 0) {
      const latestStoryTime = selectedStoryGroup.stories.reduce((latest, story) => {
        return story.createdAt > latest ? story.createdAt : latest;
      }, selectedStoryGroup.stories[0].createdAt);
      markStoryAsViewed(selectedStoryGroup.user.id, latestStoryTime);
      const currentIndex = storyGroups.findIndex(g => g.user.id === selectedStoryGroup.user.id);
      if (currentIndex < storyGroups.length - 1) {
        setSelectedStoryGroup(storyGroups[currentIndex + 1]);
      } else {
        setSelectedStoryGroup(null);
      }
    }
  };

  const markStoryAsViewed = (storyUserId: string, latestStoryTime: string) => {
    setViewedStoryTimestamps(prev => {
      const updated = { ...prev, [storyUserId]: latestStoryTime };
      if (userId) {
        localStorage.setItem(`viewed_story_timestamps_${userId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const hasUnviewedStories = (group: StoryGroup): boolean => {
    if (!group.stories.length) return false;
    const latestStoryTime = group.stories.reduce((latest, story) => {
      return story.createdAt > latest ? story.createdAt : latest;
    }, group.stories[0].createdAt);
    const viewedAt = viewedStoryTimestamps[group.user.id];
    if (!viewedAt) return true;
    return latestStoryTime > viewedAt;
  };

  const handleCloseStoryViewer = () => {
    if (selectedStoryGroup && selectedStoryGroup.stories.length > 0) {
      const latestStoryTime = selectedStoryGroup.stories.reduce((latest, story) => {
        return story.createdAt > latest ? story.createdAt : latest;
      }, selectedStoryGroup.stories[0].createdAt);
      markStoryAsViewed(selectedStoryGroup.user.id, latestStoryTime);
    }
    setSelectedStoryGroup(null);
  };

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
        setShowChatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !userId) return;

    setUploading(true);
    setShowAttachMenu(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const isVideo = file.type.startsWith('video/');
        
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: userId,
            receiverId: selectedConversation.otherUser.id,
            messageType: isVideo ? 'video' : 'image',
            mediaUrl: uploadData.url
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (selectedConversation.id === 'new' && data.conversationId) {
            await fetchConversations(userId);
            setSelectedConversation({
              ...selectedConversation,
              id: data.conversationId
            });
            fetchMessages(data.conversationId);
          } else {
            fetchMessages(selectedConversation.id);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const copyMessageText = (content: string) => {
    navigator.clipboard.writeText(content);
    setSelectedMessageId(null);
  };

  const handleCameraCapture = async (data: {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    layer: string;
    destination: 'feed' | 'story' | 'save';
  }) => {
    if (!selectedConversation || !userId) {
      setShowCameraCapture(false);
      return;
    }

    setSending(true);
    setShowCameraCapture(false);
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          receiverId: selectedConversation.otherUser.id,
          messageType: data.mediaType,
          mediaUrl: data.mediaUrl
        })
      });

      if (res.ok) {
        const resData = await res.json();
        if (selectedConversation.id === 'new' && resData.conversationId) {
          await fetchConversations(userId);
          setSelectedConversation({
            ...selectedConversation,
            id: resData.conversationId
          });
          fetchMessages(resData.conversationId);
        } else {
          fetchMessages(selectedConversation.id);
        }
      }
    } catch (error) {
      console.error('Error sending camera capture:', error);
    } finally {
      setSending(false);
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
        <div className="w-20 h-20 bg-gradient-to-br from-[#16a34a] to-[#000000] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Sign up to start messaging other users.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#16a34a] to-[#000000] text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-lg"
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
          <Loader2 className="w-10 h-10 animate-spin text-[#16a34a] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] safe-area-top pt-4">
        <div className="h-full flex rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-700">
          
          <div className={`w-full md:w-[380px] flex flex-col bg-white dark:bg-[#111111] ${selectedConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 bg-gray-50 dark:bg-[#000000] border-b border-gray-200 dark:border-[#16a34a]/20">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-[#16a34a]">Chats</h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowCameraCapture(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors"
                    title="Take photo or video"
                  >
                    <Camera className="w-5 h-5 text-[#16a34a]" />
                  </button>
                  <div className="relative" ref={optionsMenuRef}>
                    <button 
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-[#16a34a]" />
                    </button>
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#16a34a]/20 py-2 z-50">
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                          <User className="w-5 h-5" />
                          <span>New Group</span>
                        </button>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                          <MessageCircle className="w-5 h-5" />
                          <span>Broadcast List</span>
                        </button>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                          <VolumeX className="w-5 h-5" />
                          <span>Muted Chats</span>
                        </button>
                        <div className="border-t border-gray-200 dark:border-[#16a34a]/20 my-1"></div>
                        <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                          <Flag className="w-5 h-5" />
                          <span>Settings</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#16a34a]/30 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="border-b border-gray-200 dark:border-[#16a34a]/20 bg-gray-50 dark:bg-[#0a0a0a]">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status</h2>
                  <span className="text-xs text-gray-500">24h</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {userId && (
                    <button
                      onClick={() => setShowStoryCreator(true)}
                      className="flex-shrink-0 flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#1a1a1a] border-2 border-dashed border-[#16a34a] flex items-center justify-center relative">
                        <Plus className="w-6 h-6 text-[#16a34a]" />
                      </div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate w-14 text-center">
                        Add Status
                      </span>
                    </button>
                  )}

                  {storiesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-[#1a1a1a] animate-pulse" />
                        <div className="w-10 h-2 bg-gray-200 dark:bg-[#1a1a1a] rounded mt-1 animate-pulse" />
                      </div>
                    ))
                  ) : (
                    storyGroups.map((group) => {
                      const hasNewStories = hasUnviewedStories(group);
                      return (
                        <button
                          key={group.user.id}
                          onClick={() => setSelectedStoryGroup(group)}
                          className="flex-shrink-0 flex flex-col items-center"
                        >
                          <div className={`w-14 h-14 rounded-full p-0.5 ${
                            hasNewStories 
                              ? 'bg-gradient-to-br from-[#16a34a] via-green-500 to-emerald-400' 
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            <div className="w-full h-full rounded-full bg-white dark:bg-[#0a0a0a] p-0.5">
                              {group.user.avatarUrl ? (
                                <img
                                  src={group.user.avatarUrl}
                                  alt={group.user.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-[#1a1a1a] flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 truncate w-14 text-center">
                            {group.user.username}
                          </span>
                        </button>
                      );
                    })
                  )}

                  {!storiesLoading && storyGroups.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2 px-2">
                      No status updates yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 h-full flex items-center justify-center">
                  <div>
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-[#16a34a]/30">
                      <MessageCircle className="w-8 h-8 text-[#16a34a]" />
                    </div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">No conversations yet</p>
                    <p className="text-sm mt-2 text-gray-500">Start following people and send them a message!</p>
                  </div>
                </div>
              ) : (
                <div>
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-left border-b border-gray-100 dark:border-[#16a34a]/10 ${
                        selectedConversation?.id === conv.id 
                          ? 'bg-green-50 dark:bg-[#16a34a]/10 border-l-4 border-l-[#16a34a]' 
                          : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#16a34a] to-[#000000] flex items-center justify-center overflow-hidden ring-2 ring-[#16a34a]/30">
                          {conv.otherUser.avatarUrl ? (
                            <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-white" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#16a34a] rounded-full border-2 border-white dark:border-[#0a0a0a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {conv.otherUser.username}
                          </span>
                          <span className={`text-xs flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? 'text-[#16a34a] font-semibold' : 'text-gray-500'}`}>
                            {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {conv.lastMessage && conv.lastMessage.senderId === userId && (
                            <CheckCheck className="w-4 h-4 text-[#16a34a] flex-shrink-0" />
                          )}
                          {conv.lastMessage && (
                            <p className={`text-sm truncate flex-1 ${conv.unreadCount > 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                              {conv.lastMessage.messageType === 'audio' ? '🎵 Voice message' : conv.lastMessage.messageType === 'image' ? '📸 Photo' : conv.lastMessage.content}
                            </p>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-[#16a34a] text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
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

          <div className={`flex-1 flex flex-col bg-gray-100 dark:bg-[#0f0f0f] ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <>
                <div className="px-4 py-3 bg-white dark:bg-[#000000] border-b border-gray-200 dark:border-[#16a34a]/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full"
                    >
                      <ArrowLeft className="w-5 h-5 text-[#16a34a]" />
                    </button>
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-[#000000] flex items-center justify-center overflow-hidden ring-2 ring-[#16a34a]/50">
                          {selectedConversation.otherUser.avatarUrl ? (
                            <img src={selectedConversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#16a34a] rounded-full border-2 border-white dark:border-[#000000]" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {selectedConversation.otherUser.username}
                        </p>
                        <p className="text-xs text-[#16a34a]">online</p>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors">
                      <Video className="w-5 h-5 text-[#16a34a]" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors">
                      <Phone className="w-5 h-5 text-[#16a34a]" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-[#16a34a]" />
                      </button>
                      {showChatMenu && (
                        <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#16a34a]/20 py-2 z-50">
                          <button 
                            onClick={() => setShowProfile(true)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                          >
                            <User className="w-5 h-5" />
                            <span>View Profile</span>
                          </button>
                          <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                            <VolumeX className="w-5 h-5" />
                            <span>Mute Notifications</span>
                          </button>
                          <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                            <Search className="w-5 h-5" />
                            <span>Search in Chat</span>
                          </button>
                          <div className="border-t border-gray-200 dark:border-[#16a34a]/20 my-1"></div>
                          <button className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200">
                            <Ban className="w-5 h-5" />
                            <span>Block User</span>
                          </button>
                          <button className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600">
                            <Trash2 className="w-5 h-5" />
                            <span>Delete Chat</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50 dark:bg-transparent"
                  style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}
                >
                  <style jsx>{`
                    .dark div[style] {
                      background-image: linear-gradient(rgba(0,0,0,0.95), rgba(0,0,0,0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") !important;
                    }
                  `}</style>
                  {messages.length === 0 && selectedConversation.id === 'new' && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-[#16a34a]/20">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#16a34a] to-[#000000] rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#16a34a]/30">
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
                            <span className="px-4 py-1.5 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-full text-xs text-[#16a34a] shadow-sm border border-gray-200 dark:border-[#16a34a]/20">
                              {formatDateSeparator(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2'} group`}>
                          <div
                            className={`relative max-w-[75%] px-3 py-2 shadow-md ${
                              isMe
                                ? 'bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-2xl rounded-tr-sm'
                                : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#16a34a]/20 rounded-2xl rounded-tl-sm'
                            }`}
                            onClick={() => setSelectedMessageId(selectedMessageId === msg.id ? null : msg.id)}
                          >
                            {msg.messageType === 'audio' && msg.mediaUrl ? (
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className={`w-10 h-10 ${isMe ? 'bg-black/30' : 'bg-[#16a34a]'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                  <Mic className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <audio src={msg.mediaUrl} controls className="w-full h-8" />
                                  {msg.audioDuration && (
                                    <span className={`text-xs ${isMe ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>{formatTime(msg.audioDuration)}</span>
                                  )}
                                </div>
                              </div>
                            ) : msg.messageType === 'image' && msg.mediaUrl ? (
                              <div className="rounded-lg overflow-hidden -m-1">
                                <img src={msg.mediaUrl} alt="" className="max-w-full max-h-[300px] object-cover" />
                              </div>
                            ) : msg.messageType === 'video' && msg.mediaUrl ? (
                              <div className="rounded-lg overflow-hidden -m-1">
                                <video 
                                  src={msg.mediaUrl} 
                                  controls 
                                  className="max-w-full max-h-[300px]"
                                  preload="metadata"
                                />
                              </div>
                            ) : (
                              <p className={`text-[15px] leading-relaxed ${isMe ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                {msg.content}
                              </p>
                            )}
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[11px] ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {isMe && (
                                msg.isRead ? (
                                  <CheckCheck className="w-4 h-4 text-white/70" />
                                ) : (
                                  <Check className="w-4 h-4 text-white/50" />
                                )
                              )}
                            </div>
                            
                            {selectedMessageId === msg.id && (
                              <div className={`absolute ${isMe ? 'right-full mr-2' : 'left-full ml-2'} top-0 flex items-center gap-1 bg-white dark:bg-[#1a1a1a] rounded-lg p-1 border border-gray-200 dark:border-[#16a34a]/20 shadow-lg`}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); copyMessageText(msg.content); }}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-lg transition-colors"
                                  title="Copy"
                                >
                                  <Copy className="w-4 h-4 text-[#16a34a]" />
                                </button>
                                <button 
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-lg transition-colors"
                                  title="Reply"
                                >
                                  <Reply className="w-4 h-4 text-[#16a34a]" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-[#000000] border-t border-gray-200 dark:border-[#16a34a]/20">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 rounded-full border border-red-200 dark:border-red-500/30">
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
                        <div className="relative" ref={emojiPickerRef}>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-[#16a34a]/30 text-[#16a34a]' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 hover:text-[#16a34a]'}`}
                          >
                            <Smile className="w-6 h-6" />
                          </button>
                          {showEmojiPicker && (
                            <div className="absolute bottom-14 left-0 z-50">
                              <EmojiPicker
                                onEmojiClick={handleEmojiClick}
                                width={320}
                                height={400}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="relative" ref={attachMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className={`p-2 rounded-full transition-colors ${showAttachMenu ? 'bg-[#16a34a]/30 text-[#16a34a]' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 hover:text-[#16a34a]'}`}
                          >
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
                          </button>
                          {showAttachMenu && (
                            <div className="absolute bottom-14 left-0 w-48 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#16a34a]/20 py-2 z-50">
                              <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                              >
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                  <ImageIcon className="w-5 h-5 text-white" />
                                </div>
                                <span>Photos & Videos</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setShowAttachMenu(false); setShowCameraCapture(true); }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#16a34a]/10 flex items-center gap-3 text-gray-700 dark:text-gray-200"
                              >
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Camera className="w-5 h-5 text-white" />
                                </div>
                                <span>Camera</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 relative">
                          <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message"
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#16a34a]/30 rounded-full focus:outline-none focus:ring-2 focus:ring-[#16a34a] text-gray-900 dark:text-white text-[15px] placeholder-gray-500"
                          />
                        </div>
                        
                        {newMessage.trim() ? (
                          <button
                            type="submit"
                            disabled={sending}
                            className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                          >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
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
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="text-center max-w-md px-8">
                  <div className="w-[200px] h-[200px] mx-auto mb-8 opacity-80">
                    <svg viewBox="0 0 303 172" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path d="M229.565 160.229C262.212 149.245 286.931 118.241 283.39 73.4194C278.009 5.31929 212.365 -11.5738 171.472 8.48673C115.998 37.0182 41.706 24.5765 22.1979 69.8712C2.68967 115.166 24.4655 135.141 65.0847 160.229" stroke="#16a34a" strokeWidth="2"/>
                      <path d="M151.5 122C180.495 122 204 98.495 204 69.5C204 40.505 180.495 17 151.5 17C122.505 17 99 40.505 99 69.5C99 98.495 122.505 122 151.5 122Z" fill="#16a34a" fillOpacity="0.1"/>
                      <path d="M151.5 89C162.27 89 171 80.2696 171 69.5C171 58.7304 162.27 50 151.5 50C140.73 50 132 58.7304 132 69.5C132 80.2696 140.73 89 151.5 89Z" fill="#16a34a"/>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-light text-[#16a34a] mb-4">Akorfa Messages</h2>
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

      {selectedStoryGroup && (
        <StoryViewer
          group={selectedStoryGroup}
          onClose={handleCloseStoryViewer}
          onNext={handleNextStoryGroup}
        />
      )}

      {showStoryCreator && userId && (
        <StoryCreator
          userId={userId}
          onClose={() => setShowStoryCreator(false)}
          onCreated={handleStoryCreated}
        />
      )}

      {showCameraCapture && userId && (
        <CameraCapture
          userId={userId}
          onClose={() => setShowCameraCapture(false)}
          onCapture={handleCameraCapture}
        />
      )}
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#16a34a]" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
