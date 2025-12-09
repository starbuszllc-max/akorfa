'use client';

import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, Award, Trophy, Users, Coins, ArrowLeft, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import ProgressHUD from '@/components/hud/ProgressHUD';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
  actor?: {
    username: string;
    avatarUrl?: string;
  };
}

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = localStorage.getItem('demo_user_id');
    setUserId(id);
    if (id) {
      fetchNotifications(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (uid: string) => {
    try {
      const res = await fetch(`/api/notifications?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAllRead: true })
      });

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId })
      });

      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'badge': return <Award className="w-5 h-5 text-yellow-500" />;
      case 'challenge': return <Trophy className="w-5 h-5 text-purple-500" />;
      case 'follow': return <Users className="w-5 h-5 text-green-500" />;
      case 'tip': return <Coins className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString();
  };

  const groupNotifications = (notifs: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    notifs.forEach(n => {
      const date = new Date(n.createdAt);
      if (date >= todayStart) {
        today.push(n);
      } else if (date >= yesterdayStart) {
        yesterday.push(n);
      } else if (date >= weekStart) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  if (!mounted) {
    return null;
  }

  const grouped = groupNotifications(notifications);

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      onClick={() => !notification.isRead && markAsRead(notification.id)}
      className={`p-4 border-b border-gray-100 dark:border-slate-700/50 cursor-pointer transition-colors ${
        !notification.isRead 
          ? 'bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' 
          : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-full ${
          !notification.isRead 
            ? 'bg-indigo-100 dark:bg-indigo-900/30' 
            : 'bg-gray-100 dark:bg-slate-700'
        }`}>
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${
            !notification.isRead 
              ? 'text-gray-900 dark:text-white font-semibold' 
              : 'text-gray-700 dark:text-gray-300 font-medium'
          }`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatTime(notification.createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );

  const NotificationGroup = ({ title, items }: { title: string; items: Notification[] }) => {
    if (items.length === 0) return null;
    
    return (
      <div>
        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 sticky top-[140px] z-10">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {items.map(notification => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto">
          <div className="p-4">
            <ProgressHUD userId={userId || undefined} isVisible={true} sticky={true} />
          </div>
          
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800/50 min-h-[calc(100vh-180px)]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              When you get notifications about your activity, they'll show up here.
            </p>
          </div>
        ) : (
          <>
            <NotificationGroup title="Today" items={grouped.today} />
            <NotificationGroup title="Yesterday" items={grouped.yesterday} />
            <NotificationGroup title="This Week" items={grouped.thisWeek} />
            <NotificationGroup title="Earlier" items={grouped.older} />
          </>
        )}
      </div>

      <div className="h-24" />
    </div>
  );
}
