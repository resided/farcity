'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { 
  Coins, 
  Diamond, 
  Star, 
  TrendingUp, 
  Building2, 
  ShoppingBag,
  Zap,
  Menu,
  X,
  Users,
  Briefcase,
  Play,
  Pause,
  FastForward,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOL_INFO, Tool } from '@/lib/types';

export default function GameHUD() {
  const {
    cast,
    premium,
    level,
    xp,
    xpToNextLevel,
    buildings,
    stats,
    speed,
    year,
    month,
    day,
    selectedTool,
    calculateIncome,
    calculateBoostMultiplier,
    setShowShop,
    setSpeed,
    setTool,
    collectIncome,
  } = useGameStore();
  
  const [income, setIncome] = useState(0);
  const [boostMultiplier, setBoostMultiplier] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  
  useEffect(() => {
    setIncome(calculateIncome());
    setBoostMultiplier(calculateBoostMultiplier());
  }, [buildings, calculateIncome, calculateBoostMultiplier]);
  
  // Auto-collect on mount
  useEffect(() => {
    const collected = collectIncome();
    if (collected > 0) {
      // Could show a notification here
    }
  }, []);
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const tools: Tool[] = ['select', 'bulldoze', 'road', 'rail', 'zone_residential', 'zone_commercial', 'zone_industrial', 'zone_dezone', 'park', 'tree'];
  
  return (
    <>
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left - Logo & Level */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <span className="text-xl">🏙️</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-white tracking-tight">FarCity</h1>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-400">Level {level}</span>
                  </div>
                </div>
              </div>
              
              {/* Date Display */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-600/30">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-white font-medium">
                  {monthNames[month - 1]} {day}, {year}
                </span>
              </div>
              
              {/* Speed Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-xl border border-slate-600/30">
                <button
                  onClick={() => setSpeed(0)}
                  className={`p-1.5 rounded-lg transition-colors ${speed === 0 ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSpeed(1)}
                  className={`p-1.5 rounded-lg transition-colors ${speed === 1 ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSpeed(2)}
                  className={`p-1.5 rounded-lg transition-colors ${speed === 2 ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FastForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSpeed(3)}
                  className={`p-1.5 rounded-lg transition-colors ${speed === 3 ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FastForward className="w-4 h-4" />
                  <FastForward className="w-4 h-4 -ml-2" />
                </button>
              </div>
            </div>
            
            {/* Center - Currency & Stats */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Money */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-900/60 to-green-900/60 px-3 py-2 rounded-xl border border-emerald-500/30"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-emerald-300">Money</div>
                  <div className="font-bold text-white text-sm">${formatNumber(stats.money)}</div>
                </div>
              </motion.div>
              
              {/* Population */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 px-3 py-2 rounded-xl border border-blue-500/30"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-blue-300">Population</div>
                  <div className="font-bold text-white text-sm">{formatNumber(stats.population)}</div>
                </div>
              </motion.div>
              
              {/* Jobs */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-amber-900/60 to-yellow-900/60 px-3 py-2 rounded-xl border border-amber-500/30"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-amber-300">Jobs</div>
                  <div className="font-bold text-white text-sm">{formatNumber(stats.jobs)}</div>
                </div>
              </motion.div>
            </div>
            
            {/* Right - Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Income indicator */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-600/30">
                <TrendingUp className={`w-4 h-4 ${stats.income - stats.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                <div>
                  <div className="text-xs text-gray-400">Net Income</div>
                  <div className={`font-bold text-sm ${stats.income - stats.expenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats.income - stats.expenses >= 0 ? '+' : ''}{formatNumber(stats.income - stats.expenses)}/mo
                  </div>
                </div>
              </div>
              
              {/* Shop Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowShop(true)}
                className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 rounded-xl font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop
              </motion.button>
              
              {/* Mobile Menu */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 rounded-lg bg-white/10"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Tools Panel */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <motion.button
                key={tool}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTool(tool)}
                className={`relative p-3 rounded-xl transition-all ${
                  selectedTool === tool
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/50'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{TOOL_INFO[tool].icon}</span>
                {selectedTool === tool && (
                  <motion.div
                    layoutId="tool-indicator"
                    className="absolute inset-0 bg-violet-500 rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          
          {/* Tool info tooltip */}
          {selectedTool !== 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg border border-white/10 whitespace-nowrap"
            >
              <div className="font-semibold text-white text-sm">{TOOL_INFO[selectedTool].name}</div>
              <div className="text-gray-400 text-xs">{TOOL_INFO[selectedTool].description}</div>
              {TOOL_INFO[selectedTool].cost > 0 && (
                <div className="text-emerald-400 text-xs mt-1">${TOOL_INFO[selectedTool].cost}</div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 bg-gray-900/95 backdrop-blur-lg rounded-2xl p-4 border border-white/10"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-emerald-900/40 p-3 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-emerald-300">Money</div>
                  <div className="font-bold text-white">${formatNumber(stats.money)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-900/40 p-3 rounded-xl">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-blue-300">Population</div>
                  <div className="font-bold text-white">{formatNumber(stats.population)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-900/40 p-3 rounded-xl">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xs text-amber-300">Jobs</div>
                  <div className="font-bold text-white">{formatNumber(stats.jobs)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/40 p-3 rounded-xl">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-xs text-slate-300">Date</div>
                  <div className="font-bold text-white">{monthNames[month - 1]} {year}</div>
                </div>
              </div>
            </div>
            
            {/* Speed controls */}
            <div className="flex items-center justify-center gap-2 mt-3 mb-3">
              {[0, 1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
                  className={`p-2 rounded-lg transition-colors ${speed === s ? 'bg-violet-500 text-white' : 'bg-white/10 text-gray-400'}`}
                >
                  {s === 0 ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {s > 1 && <span className="text-xs">{s}x</span>}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowShop(true);
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 rounded-xl font-semibold text-white"
            >
              <ShoppingBag className="w-5 h-5" />
              Open Shop
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Boost Active Indicator */}
      {boostMultiplier > 1 && (
        <motion.div
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          className="fixed top-24 right-4 z-40"
        >
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 px-3 py-2 rounded-xl shadow-lg shadow-yellow-500/30">
            <Zap className="w-4 h-4 text-white animate-pulse" />
            <span className="font-bold text-white">{boostMultiplier}x Boost Active!</span>
          </div>
        </motion.div>
      )}
    </>
  );
}
