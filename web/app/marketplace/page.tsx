'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  ShoppingBag, Coins, Sparkles, Frame, Sticker, Zap, 
  Award, CheckCircle, Star 
} from 'lucide-react';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  itemType: string;
  coinPrice: number;
  imageUrl: string;
  owned: boolean;
}

const GIFT_TYPES = [
  { type: 'star', name: 'Star', coins: 10, emoji: '⭐' },
  { type: 'heart', name: 'Heart', coins: 20, emoji: '❤️' },
  { type: 'diamond', name: 'Diamond', coins: 50, emoji: '💎' },
  { type: 'crown', name: 'Crown', coins: 100, emoji: '👑' },
  { type: 'rocket', name: 'Rocket', coins: 200, emoji: '🚀' },
  { type: 'trophy', name: 'Trophy', coins: 500, emoji: '🏆' }
];

const MOCK_ITEMS: MarketplaceItem[] = [
  { id: '1', name: 'Golden Frame', description: 'Add a golden border to your profile', itemType: 'frame', coinPrice: 100, imageUrl: '', owned: false },
  { id: '2', name: 'Diamond Frame', description: 'Premium diamond-studded frame', itemType: 'frame', coinPrice: 250, imageUrl: '', owned: false },
  { id: '3', name: 'Wisdom Badge', description: 'Show your wisdom journey', itemType: 'badge', coinPrice: 150, imageUrl: '', owned: false },
  { id: '4', name: 'Post Boost', description: 'Boost your post for 24 hours', itemType: 'boost', coinPrice: 50, imageUrl: '', owned: false },
  { id: '5', name: 'Super Boost', description: 'Maximum visibility for 48 hours', itemType: 'boost', coinPrice: 200, imageUrl: '', owned: false },
  { id: '6', name: 'Growth Sticker Pack', description: 'Express yourself with growth stickers', itemType: 'sticker', coinPrice: 75, imageUrl: '', owned: false },
  { id: '7', name: 'Mindful Avatar', description: 'Exclusive avatar for mindful creators', itemType: 'avatar', coinPrice: 300, imageUrl: '', owned: false },
  { id: '8', name: 'Streak Shield', description: 'Protect your streak for one day', itemType: 'boost', coinPrice: 25, imageUrl: '', owned: false }
];

const CATEGORIES = [
  { id: 'all', name: 'All', icon: ShoppingBag },
  { id: 'gift', name: 'Gifts', icon: Sparkles },
  { id: 'frame', name: 'Frames', icon: Frame },
  { id: 'boost', name: 'Boosts', icon: Zap },
  { id: 'badge', name: 'Badges', icon: Award },
  { id: 'sticker', name: 'Stickers', icon: Sticker }
];

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>(MOCK_ITEMS);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [coinsBalance, setCoinsBalance] = useState(500);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const mockUserId = 'demo-user';
      const [marketRes, walletRes] = await Promise.all([
        fetch(`/api/marketplace?userId=${mockUserId}`),
        fetch(`/api/wallet?userId=${mockUserId}`)
      ]);

      const marketData = await marketRes.json();
      const walletData = await walletRes.json();

      if (marketData.items?.length) {
        setItems(marketData.items);
      }
      setCoinsBalance(walletData.wallet?.coinsBalance || 500);
    } catch (error) {
      console.error('Failed to fetch marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId: string) => {
    setPurchasing(itemId);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user', itemId })
      });

      if (res.ok) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          setCoinsBalance(prev => prev - item.coinPrice);
          setItems(prev => prev.map(i => i.id === itemId ? { ...i, owned: true } : i));
        }
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const filteredItems = activeCategory === 'all' 
    ? items 
    : activeCategory === 'gift' 
      ? [] 
      : items.filter(item => item.itemType === activeCategory);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'frame': return <Frame className="w-8 h-8 text-purple-400" />;
      case 'boost': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'badge': return <Award className="w-8 h-8 text-blue-400" />;
      case 'sticker': return <Sticker className="w-8 h-8 text-pink-400" />;
      case 'avatar': return <Star className="w-8 h-8 text-orange-400" />;
      default: return <Sparkles className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-purple-400" />
              Marketplace
            </h1>
            <p className="text-gray-400">Get gifts, frames, boosts, and more</p>
          </div>
          <Card className="bg-gradient-to-r from-yellow-600/30 to-yellow-800/30 border-yellow-500/30 px-6 py-3 inline-flex items-center gap-3">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span className="text-2xl font-bold text-white">{coinsBalance.toLocaleString()}</span>
            <span className="text-yellow-300">coins</span>
            <a href="/wallet" className="ml-2 text-sm text-yellow-400 hover:text-yellow-300">+ Buy</a>
          </Card>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>

        {activeCategory === 'gift' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Send Gifts to Creators</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {GIFT_TYPES.map((gift) => (
                <Card 
                  key={gift.type}
                  className="bg-white/5 border-white/10 p-4 text-center hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="text-4xl mb-2">{gift.emoji}</div>
                  <div className="text-white font-medium">{gift.name}</div>
                  <div className="flex items-center justify-center gap-1 text-yellow-400 mt-1">
                    <Coins className="w-4 h-4" />
                    <span>{gift.coins}</span>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-4 text-center">
              Send gifts on posts to support your favorite creators. They receive 50% of the coin value!
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className={`bg-white/5 border-white/10 p-4 ${item.owned ? 'ring-2 ring-green-500/50' : ''}`}
              >
                <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  {getItemIcon(item.itemType)}
                </div>
                <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">{item.coinPrice}</span>
                  </div>
                  {item.owned ? (
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasing === item.id || coinsBalance < item.coinPrice}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {purchasing === item.id ? 'Buying...' : 'Buy'}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && activeCategory !== 'gift' && !loading && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No items in this category</h3>
            <p className="text-gray-400">Check back soon for new items!</p>
          </div>
        )}
      </main>
    </div>
  );
}
