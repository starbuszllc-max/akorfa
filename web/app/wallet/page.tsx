'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Wallet, Coins, TrendingUp, ArrowUpRight, ArrowDownRight, Gift, DollarSign, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletData {
  wallet: {
    pointsBalance: number;
    coinsBalance: number;
    totalEarned: number;
    cashValue: string;
    canWithdraw: boolean;
    creatorLevel: number;
    canMonetize: boolean;
  };
  history: Array<{
    id: string;
    amount: number;
    action: string;
    description: string;
    createdAt: string;
  }>;
  conversionRate: string;
}

const COIN_PACKAGES = [
  { coins: 100, price: 0.99, popular: false },
  { coins: 500, price: 4.49, popular: true },
  { coins: 1000, price: 7.99, popular: false },
  { coins: 5000, price: 34.99, popular: false }
];

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'coins' | 'withdraw'>('overview');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const mockUserId = 'demo-user';
      const res = await fetch(`/api/wallet?userId=${mockUserId}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  const wallet = data?.wallet || { pointsBalance: 0, coinsBalance: 0, totalEarned: 0, cashValue: '0.00', canWithdraw: false, creatorLevel: 1, canMonetize: false };
  const history = data?.history || [];

  const tooltipContent: Record<string, { title: string; description: string; tips: string[] }> = {
    points: {
      title: 'Akorfa Points (AP)',
      description: 'Earn points through engagement and quality contributions. Convert to real money!',
      tips: [
        'Create quality posts to earn +5 AP',
        'Complete daily challenges for +10 AP',
        'Maintain streaks for +3 AP daily',
        '1,000 AP = $1.00 USD',
        'Withdraw at Level 2+ (500 followers)'
      ]
    },
    coins: {
      title: 'Akorfa Coins',
      description: 'Virtual currency for gifting and purchasing premium items within Akorfa.',
      tips: [
        'Send gifts to your favorite creators',
        'Purchase special emojis and stickers',
        'Unlock premium content access',
        'Buy directly or earn through special events',
        'Non-refundable, use wisely!'
      ]
    },
    earned: {
      title: 'Total Earned',
      description: 'Your all-time Akorfa Points earnings. This shows your overall contribution value.',
      tips: [
        'Track your growth over time',
        'Higher earnings = higher creator status',
        'Includes withdrawn and current points',
        'Level up faster with consistent earning',
        'Quality content earns AI bonuses'
      ]
    },
    level: {
      title: 'Creator Level',
      description: 'Your creator tier determines monetization access and special features.',
      tips: [
        'Level 1: 0-499 followers (current tier)',
        'Level 2: 500+ followers (monetization unlocked)',
        'Level 3: 5,000+ followers (premium features)',
        'Grow followers through quality content',
        'Higher levels unlock better rewards'
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-purple-400" />
            Your Wallet
          </h1>
          <p className="text-gray-400">Manage your Akorfa Points, coins, and earnings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Akorfa Points Card */}
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30 p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-purple-300 text-sm">Akorfa Points</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'points' ? null : 'points')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">{wallet.pointsBalance?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-400 mt-1">≈ ${wallet.cashValue} USD</div>
            
            <AnimatePresence>
              {activeTooltip === 'points' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-purple-500/30 rounded-xl p-4 shadow-xl"
                >
                  <h4 className="text-white font-semibold mb-2">{tooltipContent.points.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{tooltipContent.points.description}</p>
                  <ul className="space-y-1.5">
                    {tooltipContent.points.tips.map((tip, i) => (
                      <li key={i} className="text-purple-300 text-xs flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Coins Card */}
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-300 text-sm">Coins</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'coins' ? null : 'coins')}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white">{wallet.coinsBalance?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-400 mt-1">For gifts & items</div>
            
            <AnimatePresence>
              {activeTooltip === 'coins' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-yellow-500/30 rounded-xl p-4 shadow-xl"
                >
                  <h4 className="text-white font-semibold mb-2">{tooltipContent.coins.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{tooltipContent.coins.description}</p>
                  <ul className="space-y-1.5">
                    {tooltipContent.coins.tips.map((tip, i) => (
                      <li key={i} className="text-yellow-300 text-xs flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Total Earned Card */}
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30 p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-green-300 text-sm">Total Earned</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'earned' ? null : 'earned')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{wallet.totalEarned?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-400 mt-1">All-time points</div>
            
            <AnimatePresence>
              {activeTooltip === 'earned' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-green-500/30 rounded-xl p-4 shadow-xl"
                >
                  <h4 className="text-white font-semibold mb-2">{tooltipContent.earned.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{tooltipContent.earned.description}</p>
                  <ul className="space-y-1.5">
                    {tooltipContent.earned.tips.map((tip, i) => (
                      <li key={i} className="text-green-300 text-xs flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Creator Level Card */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30 p-6 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-300 text-sm">Creator Level</span>
                <button
                  onClick={() => setActiveTooltip(activeTooltip === 'level' ? null : 'level')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <Gift className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">Lvl {wallet.creatorLevel}</div>
            <div className="text-sm text-gray-400 mt-1">
              {wallet.canMonetize ? '✓ Can monetize' : 'Reach 500 followers'}
            </div>
            
            <AnimatePresence>
              {activeTooltip === 'level' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-blue-500/30 rounded-xl p-4 shadow-xl"
                >
                  <h4 className="text-white font-semibold mb-2">{tooltipContent.level.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{tooltipContent.level.description}</p>
                  <ul className="space-y-1.5">
                    {tooltipContent.level.tips.map((tip, i) => (
                      <li key={i} className="text-blue-300 text-xs flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['overview', 'history', 'coins', 'withdraw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">How to Earn Points</h3>
              <div className="space-y-3">
                {[
                  { action: 'Create a post', points: '+5 AP' },
                  { action: 'Receive a like', points: '+1 AP' },
                  { action: 'Receive a comment', points: '+2 AP' },
                  { action: 'Complete challenge', points: '+10 AP' },
                  { action: 'Daily streak', points: '+3 AP' },
                  { action: 'High assessment', points: '+20 AP' },
                  { action: 'Help others', points: '+30 AP' },
                  { action: 'AI quality bonus', points: '+5-20 AP' }
                ].map((item) => (
                  <div key={item.action} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-300">{item.action}</span>
                    <span className="text-green-400 font-medium">{item.points}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Points to Cash</h3>
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 mb-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2">1,000 AP</div>
                  <div className="text-2xl text-purple-300">=</div>
                  <div className="text-4xl font-bold text-green-400 mt-2">$1.00</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm text-center">
                Minimum withdrawal: 1,000 AP ($1.00)
                <br />
                Must be Level 2+ creator (500 followers)
              </p>
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Points History</h3>
            {history.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No transactions yet. Start earning!</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      {item.amount > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <div className="text-white font-medium">{item.description}</div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <span className={`font-semibold ${item.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount} AP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'coins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COIN_PACKAGES.map((pkg) => (
              <Card 
                key={pkg.coins}
                className={`p-6 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform ${
                  pkg.popular 
                    ? 'bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 border-yellow-500/50' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                    BEST VALUE
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Coins className={`w-8 h-8 ${pkg.popular ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className="text-2xl font-bold text-white">{pkg.coins.toLocaleString()}</span>
                </div>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium">
                  ${pkg.price}
                </button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'withdraw' && (
          <Card className="bg-white/5 border-white/10 p-6 max-w-xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Withdraw Earnings</h3>
            
            {!wallet.canMonetize ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">Unlock Monetization</h4>
                <p className="text-gray-400 mb-4">
                  Reach 500 followers to become a Verified Contributor and start withdrawing your earnings.
                </p>
                <div className="text-purple-400 font-medium">
                  Current Level: {wallet.creatorLevel}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Available</span>
                    <span className="text-white font-bold">{wallet.pointsBalance?.toLocaleString()} AP (${wallet.cashValue})</span>
                  </div>
                </div>
                <input 
                  type="number" 
                  placeholder="Points to withdraw (min 1,000)"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                  min={1000}
                  max={wallet.pointsBalance}
                />
                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  disabled={!wallet.canWithdraw}
                >
                  Request Withdrawal
                </button>
                <p className="text-gray-500 text-sm text-center">
                  Payouts processed via Stripe within 3-5 business days
                </p>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
