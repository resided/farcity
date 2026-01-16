'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, getAvailableBuildings } from '@/lib/store';
import { Plus, Gift, Trophy, Users } from 'lucide-react';

// Icon components
function IconCollect({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h6M9 15h6" />
    </svg>
  );
}

export default function QuickBar() {
  const { 
    level, 
    collectIncome, 
    setShowShop,
    calculateIncome,
  } = useGameStore();
  
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [showCollected, setShowCollected] = useState(false);
  
  const income = calculateIncome();
  
  const handleCollect = () => {
    const amount = collectIncome();
    if (amount > 0) {
      setCollectedAmount(amount);
      setShowCollected(true);
      setTimeout(() => setShowCollected(false), 2000);
    }
  };
  
  const handleDailyReward = () => {
    setShowDailyReward(true);
  };
  
  return (
    <>
      {/* Quick Actions */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40"
      >
        <div className="flex flex-col gap-2">
          {/* Collect Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCollect}
            disabled={income === 0}
            className="relative w-12 h-12 bg-[#00ff88] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#00cc6a]"
          >
            <IconCollect className="w-5 h-5 text-black" />
            {income > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3366] flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">$</span>
              </div>
            )}
          </motion.button>
          
          {/* Build Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShop(true)}
            className="w-12 h-12 bg-white flex items-center justify-center transition-all hover:bg-[#c8ff00]"
          >
            <Plus className="w-5 h-5 text-black" />
          </motion.button>
          
          {/* Daily Reward */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDailyReward}
            className="relative w-12 h-12 bg-[#ffaa00] flex items-center justify-center transition-all hover:bg-[#cc8800]"
          >
            <Gift className="w-5 h-5 text-black" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3366] flex items-center justify-center animate-pulse">
              <span className="text-[8px] font-bold text-white">!</span>
            </div>
          </motion.button>
          
          {/* Leaderboard */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 glass-dark flex items-center justify-center transition-all hover:bg-white/10"
          >
            <Trophy className="w-5 h-5 text-[#666]" />
          </motion.button>
          
          {/* Friends */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 glass-dark flex items-center justify-center transition-all hover:bg-white/10"
          >
            <Users className="w-5 h-5 text-[#666]" />
          </motion.button>
        </div>
      </motion.div>
      
      {/* Collection Animation */}
      {showCollected && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: -50 }}
          transition={{ duration: 2 }}
          className="fixed left-20 top-1/2 -translate-y-1/2 z-50"
        >
          <div className="bg-[#00ff88] text-black px-4 py-2 text-caption text-sm">
            +{collectedAmount.toLocaleString()} COINS
          </div>
        </motion.div>
      )}
      
      {/* Daily Reward Modal */}
      {showDailyReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDailyReward(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a0a] border border-[#2a2a2a] p-8 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 mx-auto bg-[#ffaa00] flex items-center justify-center mb-6">
              <Gift className="w-10 h-10 text-black" />
            </div>
            
            <h2 className="text-headline text-2xl text-white mb-2">DAILY REWARD</h2>
            <p className="text-body text-sm text-[#666] mb-6">Return daily for bigger rewards</p>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {[100, 150, 200, 300, 400, 500, 1000].map((reward, i) => (
                <div
                  key={i}
                  className={`p-2 ${
                    i === 0
                      ? 'bg-[#ffaa00] text-black'
                      : 'bg-[#1a1a1a] text-[#666]'
                  }`}
                >
                  <div className="text-caption text-[8px]">D{i + 1}</div>
                  <div className="stat-value text-xs">{reward}</div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowDailyReward(false);
              }}
              className="w-full btn-primary py-4 text-sm"
            >
              CLAIM 100 COINS
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
