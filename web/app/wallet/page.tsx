'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Gift, 
  DollarSign, 
  Clock, 
  CreditCard, 
  Star, 
  AlertCircle, 
  CheckCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Send,
  Plus,
  MoreHorizontal,
  Sparkles,
  Shield
} from 'lucide-react';

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

interface CreditData {
  creditScore: {
    score: number;
    tier: string;
    creditLimit: number;
    interestRate: number;
    totalLoansCompleted: number;
    onTimePayments: number;
    latePayments: number;
  };
  activeLoans: Array<{
    id: string;
    amount: number;
    totalDue: number;
    amountRepaid: number;
    termDays: number;
    dueDate: string;
    status: string;
    createdAt: string;
  }>;
  loanHistory: Array<{
    id: string;
    amount: number;
    totalDue: number;
    status: string;
    createdAt: string;
    repaidAt: string | null;
  }>;
  canBorrow: boolean;
  maxBorrowAmount: number;
  currentBalance: number;
}

const TIER_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  bronze: { bg: 'from-orange-600 to-orange-800', text: 'text-orange-400', icon: '🥉' },
  silver: { bg: 'from-gray-400 to-gray-600', text: 'text-gray-300', icon: '🥈' },
  gold: { bg: 'from-yellow-500 to-yellow-700', text: 'text-yellow-400', icon: '🥇' },
  platinum: { bg: 'from-cyan-500 to-cyan-700', text: 'text-cyan-400', icon: '💎' },
  diamond: { bg: 'from-purple-500 to-blue-600', text: 'text-purple-300', icon: '👑' }
};

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [activeAccount, setActiveAccount] = useState<'points' | 'coins' | 'credit'>('points');
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    if (activeAccount === 'credit') {
      fetchCredit();
    }
  }, [activeAccount]);

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

  const fetchCredit = async () => {
    setCreditLoading(true);
    try {
      const mockUserId = 'demo-user';
      const res = await fetch(`/api/credit?userId=${mockUserId}`);
      const result = await res.json();
      if (!result.error) {
        setCreditData(result);
      }
    } catch (error) {
      console.error('Failed to fetch credit:', error);
    } finally {
      setCreditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  const wallet = data?.wallet || { 
    pointsBalance: 0, 
    coinsBalance: 0, 
    totalEarned: 0, 
    cashValue: '0.00', 
    canWithdraw: false, 
    creatorLevel: 1, 
    canMonetize: false 
  };
  const history = data?.history || [];

  const totalValue = (wallet.pointsBalance / 1000) + (wallet.coinsBalance * 0.01);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 pt-6 pb-32 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Balance</p>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">
                    {showBalance ? `$${totalValue.toFixed(2)}` : '••••••'}
                  </h1>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-white/60 hover:text-white"
                  >
                    {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/20 rounded-xl text-white text-sm font-medium shrink-0">
              <Plus className="w-4 h-4" />
              Add Funds
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/20 rounded-xl text-white text-sm font-medium shrink-0">
              <Send className="w-4 h-4" />
              Send
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/20 rounded-xl text-white text-sm font-medium shrink-0">
              <ArrowDownRight className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-24">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['points', 'coins', 'credit'] as const).map((account) => (
              <button
                key={account}
                onClick={() => setActiveAccount(account)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeAccount === account
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-lg'
                    : 'bg-white/80 dark:bg-slate-800/80 text-gray-600 dark:text-gray-400'
                }`}
              >
                {account === 'points' && 'Akorfa Points'}
                {account === 'coins' && 'Coins'}
                {account === 'credit' && 'Credit'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeAccount === 'points' && (
              <motion.div
                key="points"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <span className="font-medium">Akorfa Points</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Primary</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-white/70 text-sm mb-1">Available Balance</p>
                    <p className="text-3xl font-bold">
                      {showBalance ? wallet.pointsBalance.toLocaleString() : '••••'} AP
                    </p>
                    <p className="text-white/70 text-sm mt-1">
                      ≈ ${showBalance ? wallet.cashValue : '••••'} USD
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div>
                      <p className="text-white/60 text-xs">Total Earned</p>
                      <p className="font-semibold">{wallet.totalEarned.toLocaleString()} AP</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs">Creator Level</p>
                      <p className="font-semibold">Level {wallet.creatorLevel}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    How to Earn Points
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { action: 'Create a post', points: '+5 AP', icon: '📝' },
                      { action: 'Complete challenge', points: '+10 AP', icon: '🏆' },
                      { action: 'Daily streak bonus', points: '+3 AP', icon: '🔥' },
                      { action: 'Help others', points: '+30 AP', icon: '🤝' },
                    ].map((item) => (
                      <div key={item.action} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{item.action}</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-medium text-sm">{item.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeAccount === 'coins' && (
              <motion.div
                key="coins"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      <span className="font-medium">Akorfa Coins</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Virtual</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-white/70 text-sm mb-1">Available Balance</p>
                    <p className="text-3xl font-bold">
                      {showBalance ? wallet.coinsBalance.toLocaleString() : '••••'} Coins
                    </p>
                    <p className="text-white/70 text-sm mt-1">
                      For gifts & premium items
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-yellow-500" />
                    Buy Coins
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { coins: 100, price: 0.99 },
                      { coins: 500, price: 4.49, popular: true },
                      { coins: 1000, price: 7.99 },
                      { coins: 5000, price: 34.99 }
                    ].map((pkg) => (
                      <button
                        key={pkg.coins}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          pkg.popular 
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-medium">
                            Best Value
                          </span>
                        )}
                        <div className="flex items-center gap-1 mb-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-gray-900 dark:text-white">{pkg.coins}</span>
                        </div>
                        <p className="text-indigo-600 dark:text-indigo-400 font-semibold">${pkg.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    What You Can Do
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { action: 'Send gifts to creators', icon: '🎁' },
                      { action: 'Unlock premium stickers', icon: '⭐' },
                      { action: 'Boost your posts', icon: '🚀' },
                      { action: 'Access exclusive content', icon: '💎' },
                    ].map((item) => (
                      <div key={item.action} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{item.action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeAccount === 'credit' && (
              <motion.div
                key="credit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {creditLoading ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                  </div>
                ) : creditData ? (
                  <>
                    <div className={`bg-gradient-to-br ${TIER_COLORS[creditData.creditScore.tier]?.bg || 'from-orange-600 to-orange-800'} rounded-2xl p-5 text-white shadow-xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">Credit Account</span>
                        </div>
                        <span className="text-2xl">{TIER_COLORS[creditData.creditScore.tier]?.icon || '🥉'}</span>
                      </div>
                      <div className="mb-4">
                        <p className="text-white/70 text-sm mb-1">Credit Score</p>
                        <p className="text-4xl font-bold">{creditData.creditScore.score}</p>
                        <p className="text-white/70 text-sm mt-1 capitalize">
                          {creditData.creditScore.tier} Tier
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/20">
                        <div>
                          <p className="text-white/60 text-xs">Credit Limit</p>
                          <p className="font-semibold">{creditData.creditScore.creditLimit.toLocaleString()} AP</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-xs">Interest Rate</p>
                          <p className="font-semibold">{creditData.creditScore.interestRate}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-500" />
                        Credit Stats
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {creditData.creditScore.onTimePayments}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">On-Time</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {creditData.creditScore.latePayments}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Late</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {creditData.creditScore.totalLoansCompleted}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                        </div>
                      </div>
                    </div>

                    {creditData.activeLoans.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Active Loans</h3>
                        <div className="space-y-3">
                          {creditData.activeLoans.map((loan) => (
                            <div key={loan.id} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {loan.amount.toLocaleString()} AP
                                </span>
                                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                                  {loan.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Due: {new Date(loan.dueDate).toLocaleDateString()}</span>
                                <span>{loan.amountRepaid}/{loan.totalDue} repaid</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center">
                    <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Credit data unavailable</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Recent Activity
              </h3>
              <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1">
                See All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.amount > 0 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {item.amount > 0 ? (
                          <ArrowDownRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm ${
                      item.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {item.amount > 0 ? '+' : ''}{item.amount} AP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Convert Points to Cash</p>
                <p className="text-white/80 text-sm">1,000 AP = $1.00 USD</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
