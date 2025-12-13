'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  fullName?: string;
}

interface UserProfileCardProps {
  user: UserProfile;
  onClose: () => void;
}

export default function UserProfileCard({ user, onClose }: UserProfileCardProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl w-full md:max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-indigo-200 dark:ring-indigo-800 bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user.username}</h1>
          {user.fullName && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">{user.fullName}</p>
          )}

          <div className="space-y-3">
            <Link
              href={`/profile/${user.id}`}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>👤</span> View Full Profile
            </Link>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
