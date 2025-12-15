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
      <div className="bg-[#111111] rounded-t-3xl md:rounded-2xl w-full md:max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto border border-[#C9A962]/20">
        <div className="sticky top-0 p-4 border-b border-[#C9A962]/20 flex items-center justify-between bg-[#000000]">
          <h2 className="font-semibold text-[#C9A962]">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#C9A962]/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#C9A962]" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-[#C9A962]/30 bg-gradient-to-br from-[#C9A962] to-[#000000] flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">{user.username}</h1>
          {user.fullName && (
            <p className="text-gray-400 mb-6">{user.fullName}</p>
          )}

          <div className="space-y-3">
            <Link
              href={`/profile/${user.id}`}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#C9A962] to-[#a88a4a] text-black rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>View Full Profile</span>
            </Link>
            
            <div className="grid grid-cols-3 gap-2">
              <button className="p-3 bg-[#1a1a1a] hover:bg-[#C9A962]/20 rounded-xl transition-colors flex flex-col items-center gap-1 border border-[#C9A962]/20">
                <MessageCircle className="w-5 h-5 text-[#C9A962]" />
                <span className="text-xs text-gray-400">Message</span>
              </button>
              <button className="p-3 bg-[#1a1a1a] hover:bg-[#C9A962]/20 rounded-xl transition-colors flex flex-col items-center gap-1 border border-[#C9A962]/20">
                <UserPlus className="w-5 h-5 text-[#C9A962]" />
                <span className="text-xs text-gray-400">Follow</span>
              </button>
              <button className="p-3 bg-[#1a1a1a] hover:bg-red-900/30 rounded-xl transition-colors flex flex-col items-center gap-1 border border-[#C9A962]/20">
                <Ban className="w-5 h-5 text-red-500" />
                <span className="text-xs text-gray-400">Block</span>
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-[#1a1a1a] text-white rounded-xl font-medium hover:bg-[#C9A962]/10 transition-colors border border-[#C9A962]/20"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
