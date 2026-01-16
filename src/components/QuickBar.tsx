'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, getAvailableBuildings } from '@/lib/store';
import { Coins, Plus, Gift, Trophy, Users, Bell } from 'lucide-react';

export default function QuickBar() {
  const { 
    cast, 
    level, 
    collectIncome, 
    setShowShop,
    calculateIncome,
    buildings,
  } = useGameStore();
  
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [showCollected, setShowCollected] = useState(false);
  
  const availableBuildings = getAvailableBuildings(level);
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
    // Simulate daily reward
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
        <div className="flex flex-col gap-3">
          {/* Collect Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCollect}
            disabled={income === 0}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Coins className="w-6 h-6 text-white" />
            {income > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">$</span>
              </div>
            )}
          </motion.button>
          
          {/* Build Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowShop(true)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
          
          {/* Daily Reward */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDailyReward}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-shadow"
          >
            <Gift className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-bounce">
              <span className="text-[10px] font-bold text-white">!</span>
            </div>
          </motion.button>
          
          {/* Leaderboard */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
          >
            <Trophy className="w-6 h-6 text-white" />
          </motion.button>
          
          {/* Friends */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-shadow"
          >
            <Users className="w-6 h-6 text-white" />
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
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg">
            +{collectedAmount.toLocaleString()} Coins
          </div>
        </motion.div>
      )}
      
      {/* Daily Reward Modal */}
      {showDailyReward && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDailyReward(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-amber-900/90 to-yellow-900/90 backdrop-blur-xl rounded-3xl p-8 border border-amber-400/50 max-w-md w-full text-center"
          >
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/50">
              <Gift className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Daily Reward!</h2>
            <p className="text-amber-200 mb-6">Come back every day for bigger rewards!</p>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {[100, 150, 200, 300, 400, 500, 1000].map((reward, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg ${
                    i === 0
                      ? 'bg-amber-500 ring-2 ring-white'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="text-xs text-amber-200">Day {i + 1}</div>
                  <div className="font-bold text-white text-sm">{reward}</div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowDailyReward(false);
                // Add reward logic here
              }}
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold py-4 rounded-xl hover:from-amber-300 hover:to-yellow-400 transition-all text-lg"
            >
              Claim 100 Coins
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
