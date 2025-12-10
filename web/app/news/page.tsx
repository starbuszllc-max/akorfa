'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ExternalLink, Clock, TrendingUp, Newspaper, CheckCircle2 } from 'lucide-react';
import CategoryTabs from '@/components/feed/CategoryTabs';

interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  sourceUrl: string;
  author: string | null;
  category: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  newsSource: {
    name: string;
    logoUrl: string | null;
    trustScore: number;
  };
}

const newsCategories = [
  { id: 'all', label: 'All News', icon: <Newspaper className="w-4 h-4" />, color: 'text-gray-500' },
  { id: 'technology', label: 'Technology', icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-500' },
  { id: 'health', label: 'Health', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-500' },
  { id: 'science', label: 'Science', icon: <TrendingUp className="w-4 h-4" />, color: 'text-purple-500' },
  { id: 'environment', label: 'Environment', icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-500' }
];

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    try {
      const params = new URLSearchParams({ category, limit: '20' });
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className="w-6 h-6 text-indigo-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Verified News</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">Trusted sources</p>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {newsCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap text-xs font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className={category === cat.id ? cat.color : ''}>{cat.icon}</span>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 py-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-3 animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-slate-700 rounded-lg mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No news yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {articles.map((article) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  {article.imageUrl && (
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white/90 dark:bg-black/90 rounded-full text-[10px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                        Verified
                      </div>
                    </div>
                  )}
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5 mb-2">
                      {article.newsSource.logoUrl ? (
                        <img
                          src={article.newsSource.logoUrl}
                          alt={article.newsSource.name}
                          className="w-4 h-4 rounded"
                        />
                      ) : (
                        <Newspaper className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {article.newsSource.name}
                      </span>
                      <span className="ml-auto px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] rounded-full flex-shrink-0">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2 border-t border-gray-100 dark:border-slate-700">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </div>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Read
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
