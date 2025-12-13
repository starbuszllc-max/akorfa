'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, FileText, User, Users, MessageCircle, MapPin, ArrowLeft, Heart, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

interface SearchResults {
  posts: Array<{
    id: string;
    content: string;
    layer: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
    user: { id: string; username: string; fullName: string | null; avatarUrl: string | null } | null;
  }>;
  users: Array<{
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    akorfaScore: string | null;
    level: number;
  }>;
  groups: Array<{
    id: string;
    name: string;
    description: string | null;
    layer: string | null;
    avatarUrl: string | null;
    memberCount: number;
    isPublic: boolean;
  }>;
  comments: Array<{
    id: string;
    postId: string;
    content: string;
    createdAt: string;
    user: { id: string; username: string; avatarUrl: string | null } | null;
  }>;
  locations: Array<{
    id: string;
    city: string | null;
    region: string | null;
    country: string | null;
    user: { username: string; fullName: string | null; avatarUrl: string | null };
  }>;
}

type TabType = 'all' | 'posts' | 'users' | 'groups' | 'comments' | 'locations';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=15`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query !== initialQuery) {
        const newUrl = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
        router.replace(newUrl, { scroll: false });
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, initialQuery, router, performSearch]);

  const totalResults = results 
    ? results.posts.length + results.users.length + results.groups.length + results.comments.length + results.locations.length 
    : 0;

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'All', icon: null, count: totalResults },
    { id: 'posts', label: 'Posts', icon: <FileText className="w-3.5 h-3.5" />, count: results?.posts.length || 0 },
    { id: 'users', label: 'Users', icon: <User className="w-3.5 h-3.5" />, count: results?.users.length || 0 },
    { id: 'groups', label: 'Groups', icon: <Users className="w-3.5 h-3.5" />, count: results?.groups.length || 0 },
    { id: 'comments', label: 'Comments', icon: <MessageCircle className="w-3.5 h-3.5" />, count: results?.comments.length || 0 },
    { id: 'locations', label: 'Locations', icon: <MapPin className="w-3.5 h-3.5" />, count: results?.locations.length || 0 },
  ];

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 flex flex-col">
      <div className="flex-shrink-0 px-3 pt-3 pb-2 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, users, groups, comments..."
              autoFocus
              className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {results && (
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : !query || query.length < 2 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Enter at least 2 characters to search
            </p>
          </div>
        ) : results && totalResults === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No results found for "{query}"
            </p>
          </div>
        ) : results && (
          <div className="space-y-4">
            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Posts
                  </h3>
                )}
                <div className="space-y-2">
                  {results.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {post.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {post.user?.username || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {truncate(post.content, 150)}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {post.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {post.commentCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Users
                  </h3>
                )}
                <div className="space-y-2">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.username}
                          </span>
                          {user.level > 1 && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-full">
                              Lvl {user.level}
                            </span>
                          )}
                        </div>
                        {user.fullName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.fullName}</p>
                        )}
                        {user.bio && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
                            {truncate(user.bio, 80)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Groups
                  </h3>
                )}
                <div className="space-y-2">
                  {results.groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {group.avatarUrl ? (
                        <img
                          src={group.avatarUrl}
                          alt={group.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {group.name}
                          </span>
                          {group.isPublic ? (
                            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] rounded-full">
                              Public
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] rounded-full">
                              Private
                            </span>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {truncate(group.description, 80)}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {group.memberCount} members
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'comments') && results.comments.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Comments
                  </h3>
                )}
                <div className="space-y-2">
                  {results.comments.map((comment) => (
                    <Link
                      key={comment.id}
                      href={`/posts/${comment.postId}?comment=${comment.id}`}
                      className="block bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.user?.username || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {truncate(comment.content, 120)}
                          </p>
                          <p className="text-xs text-indigo-500 mt-1">
                            View in post →
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'locations') && results.locations.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    People by Location
                  </h3>
                )}
                <div className="space-y-2">
                  {results.locations.map((loc) => (
                    <Link
                      key={loc.id}
                      href={`/profile/${loc.id}`}
                      className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {loc.user.avatarUrl ? (
                        <img
                          src={loc.user.avatarUrl}
                          alt={loc.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                          {loc.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white block">
                          {loc.user.username}
                        </span>
                        {loc.user.fullName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{loc.user.fullName}</p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {[loc.city, loc.region, loc.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
