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
      case 'frame': return <Frame className="w-6 h-6 text-purple-400" />;
      case 'boost': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'badge': return <Award className="w-6 h-6 text-blue-400" />;
      case 'sticker': return <Sticker className="w-6 h-6 text-pink-400" />;
      case 'avatar': return <Star className="w-6 h-6 text-orange-400" />;
      default: return <Sparkles className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="max-w-6xl mx-auto px-3 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-purple-400" />
              Marketplace
            </h1>
            <p className="text-xs text-gray-400">Gifts, frames, boosts & more</p>
          </div>
          <Card className="bg-gradient-to-r from-yellow-600/30 to-yellow-800/30 border-yellow-500/30 px-4 py-2 inline-flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-bold text-white">{coinsBalance.toLocaleString()}</span>
            <span className="text-xs text-yellow-300">coins</span>
            <a href="/wallet" className="ml-1 text-xs text-yellow-400 hover:text-yellow-300">+ Buy</a>
          </Card>
        </div>

        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          ))}
        </div>

        {activeCategory === 'gift' && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white mb-3">Send Gifts</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {GIFT_TYPES.map((gift) => (
                <Card 
                  key={gift.type}
                  className="bg-white/5 border-white/10 p-3 text-center hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="text-2xl mb-1">{gift.emoji}</div>
                  <div className="text-xs text-white font-medium">{gift.name}</div>
                  <div className="flex items-center justify-center gap-0.5 text-yellow-400 mt-0.5 text-xs">
                    <Coins className="w-3 h-3" />
                    <span>{gift.coins}</span>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-3 text-center">
              Support creators - they receive 50% of the value!
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className={`bg-white/5 border-white/10 p-3 ${item.owned ? 'ring-2 ring-green-500/50' : ''}`}
              >
                <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-2">
                  {getItemIcon(item.itemType)}
                </div>
                <h3 className="text-sm text-white font-semibold mb-0.5">{item.name}</h3>
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
                    <Coins className="w-3 h-3" />
                    <span className="font-medium">{item.coinPrice}</span>
                  </div>
                  {item.owned ? (
                    <span className="flex items-center gap-0.5 text-green-400 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Owned
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item.id)}
                      disabled={purchasing === item.id || coinsBalance < item.coinPrice}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {purchasing === item.id ? '...' : 'Buy'}
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
