'use client';

import { X, MessageCircle, UserPlus, Ban, Flag } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111111] rounded-t-3xl md:rounded-2xl w-full md:max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-[#16a34a]/20">
        <div className="sticky top-0 p-4 border-b border-gray-200 dark:border-[#16a34a]/20 flex items-center justify-between bg-gray-50 dark:bg-[#000000]">
          <h2 className="font-semibold text-[#16a34a]">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#16a34a]/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#16a34a]" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-[#16a34a]/30 bg-gradient-to-br from-[#16a34a] to-[#000000] flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user.username}</h1>
          {user.fullName && (
            <p className="text-gray-500 dark:text-gray-400 mb-6">{user.fullName}</p>
          )}

          <div className="space-y-3">
            <Link
              href={`/profile/${user.id}`}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>View Full Profile</span>
            </Link>
            
            <div className="grid grid-cols-3 gap-2">
              <button className="p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#16a34a]/20 rounded-xl transition-colors flex flex-col items-center gap-1 border border-gray-200 dark:border-[#16a34a]/20">
                <MessageCircle className="w-5 h-5 text-[#16a34a]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Message</span>
              </button>
              <button className="p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#16a34a]/20 rounded-xl transition-colors flex flex-col items-center gap-1 border border-gray-200 dark:border-[#16a34a]/20">
                <UserPlus className="w-5 h-5 text-[#16a34a]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Follow</span>
              </button>
              <button className="p-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors flex flex-col items-center gap-1 border border-gray-200 dark:border-[#16a34a]/20">
                <Ban className="w-5 h-5 text-red-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Block</span>
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-[#16a34a]/10 transition-colors border border-gray-200 dark:border-[#16a34a]/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
