'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { 
  TrendingUp, 
  Menu,
  X,
  Play,
  Pause,
  FastForward,
  Plus,
  Minus,
  Grid3X3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOOL_INFO, Tool } from '@/lib/types';

// Icon components
function IconMoney({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h6M9 15h6" />
    </svg>
  );
}

function IconPeople({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0113 0" />
    </svg>
  );
}

function IconWork({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function IconCalendar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconShop({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7l2-3h12l2 3" />
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M12 7v13M6 11h0M18 11h0" />
    </svg>
  );
}

function IconZap({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

// Tool icons without emojis
const TOOL_ICONS: Record<Tool, React.ReactNode> = {
  select: <Grid3X3 className="w-5 h-5" />,
  bulldoze: <X className="w-5 h-5" />,
  road: <Minus className="w-5 h-5 rotate-45" />,
  rail: <Minus className="w-5 h-5" />,
  zone_residential: <div className="w-4 h-4 bg-[#00ff88]" />,
  zone_commercial: <div className="w-4 h-4 bg-[#0088ff]" />,
  zone_industrial: <div className="w-4 h-4 bg-[#ffaa00]" />,
  zone_dezone: <div className="w-4 h-4 border-2 border-white/50" />,
  park: <div className="w-4 h-4 rounded-full bg-[#00aa55]" />,
  tree: <div className="w-3 h-5 rounded-t-full bg-[#228844]" />,
};

export default function GameHUD() {
  const {
    level,
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
  
  const [boostMultiplier, setBoostMultiplier] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  useEffect(() => {
    setBoostMultiplier(calculateBoostMultiplier());
  }, [calculateBoostMultiplier]);
  
  useEffect(() => {
    collectIncome();
  }, [collectIncome]);
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };
  
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  
  const tools: Tool[] = ['select', 'bulldoze', 'road', 'rail', 'zone_residential', 'zone_commercial', 'zone_industrial', 'zone_dezone', 'park', 'tree'];
  
  return (
    <>
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-gradient-to-b from-black via-black/90 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left - Logo & Date */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white flex items-center justify-center">
                  <span className="text-headline text-black text-xs">FC</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-headline text-sm text-white">FARCITY</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="tag tag-volt text-[10px]">LVL {level}</span>
                  </div>
                </div>
              </div>
              
              {/* Date Display */}
              <div className="hidden md:flex items-center gap-3 glass-dark px-4 py-2">
                <IconCalendar className="w-4 h-4 text-[#666]" />
                <span className="text-caption text-[#a0a0a0]">
                  {monthNames[month - 1]} {day}, {year}
                </span>
              </div>
              
              {/* Speed Controls */}
              <div className="hidden sm:flex items-center gap-1 glass-dark px-2 py-1">
                {[0, 1, 2, 3].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
                    className={`p-2 transition-all ${
                      speed === s 
                        ? 'bg-white text-black' 
                        : 'text-[#666] hover:text-white'
                    }`}
                  >
                    {s === 0 ? (
                      <Pause className="w-4 h-4" />
                    ) : s === 1 ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <div className="flex">
                        <FastForward className="w-4 h-4" />
                        {s === 3 && <FastForward className="w-4 h-4 -ml-2" />}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Center - Stats */}
            <div className="flex items-center gap-3">
              {/* Money */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 glass-dark px-4 py-2 border-l-2 border-[#00ff88]"
              >
                <IconMoney className="w-5 h-5 text-[#00ff88]" />
                <div>
                  <div className="text-caption text-[#666] text-[10px]">FUNDS</div>
                  <div className="stat-value text-white text-sm">${formatNumber(stats.money)}</div>
                </div>
              </motion.div>
              
              {/* Population */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 glass-dark px-4 py-2 border-l-2 border-[#00ffff]"
              >
                <IconPeople className="w-5 h-5 text-[#00ffff]" />
                <div>
                  <div className="text-caption text-[#666] text-[10px]">POP</div>
                  <div className="stat-value text-white text-sm">{formatNumber(stats.population)}</div>
                </div>
              </motion.div>
              
              {/* Jobs */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="hidden lg:flex items-center gap-3 glass-dark px-4 py-2 border-l-2 border-[#ffaa00]"
              >
                <IconWork className="w-5 h-5 text-[#ffaa00]" />
                <div>
                  <div className="text-caption text-[#666] text-[10px]">JOBS</div>
                  <div className="stat-value text-white text-sm">{formatNumber(stats.jobs)}</div>
                </div>
              </motion.div>
            </div>
            
            {/* Right - Actions */}
            <div className="flex items-center gap-3">
              {/* Income indicator */}
              <div className="hidden lg:flex items-center gap-3 glass-dark px-4 py-2">
                <TrendingUp className={`w-4 h-4 ${
                  stats.income - stats.expenses >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'
                }`} />
                <div>
                  <div className="text-caption text-[#666] text-[10px]">NET</div>
                  <div className={`stat-value text-sm ${
                    stats.income - stats.expenses >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'
                  }`}>
                    {stats.income - stats.expenses >= 0 ? '+' : ''}{formatNumber(stats.income - stats.expenses)}
                  </div>
                </div>
              </div>
              
              {/* Shop Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowShop(true)}
                className="hidden sm:flex items-center gap-2 btn-primary px-5 py-3"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">BUILD</span>
              </motion.button>
              
              {/* Mobile Menu */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-3 glass-dark"
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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="glass-dark p-2">
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <motion.button
                key={tool}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTool(tool)}
                className={`relative p-3 transition-all ${
                  selectedTool === tool
                    ? 'bg-white text-black'
                    : 'text-[#666] hover:text-white hover:bg-white/5'
                }`}
              >
                {TOOL_ICONS[tool]}
              </motion.button>
            ))}
          </div>
          
          {/* Tool info */}
          {selectedTool !== 'select' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass-dark px-4 py-2 whitespace-nowrap"
            >
              <div className="text-caption text-white text-xs">{TOOL_INFO[selectedTool].name}</div>
              {TOOL_INFO[selectedTool].cost > 0 && (
                <div className="text-caption text-[#00ff88] text-[10px] mt-1">
                  ${TOOL_INFO[selectedTool].cost}
                </div>
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
            className="fixed top-24 left-4 right-4 z-50 glass-dark p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-light p-3 border-l-2 border-[#00ff88]">
                <div className="text-caption text-[#666] text-[10px]">FUNDS</div>
                <div className="stat-value text-white">${formatNumber(stats.money)}</div>
              </div>
              <div className="glass-light p-3 border-l-2 border-[#00ffff]">
                <div className="text-caption text-[#666] text-[10px]">POP</div>
                <div className="stat-value text-white">{formatNumber(stats.population)}</div>
              </div>
              <div className="glass-light p-3 border-l-2 border-[#ffaa00]">
                <div className="text-caption text-[#666] text-[10px]">JOBS</div>
                <div className="stat-value text-white">{formatNumber(stats.jobs)}</div>
              </div>
              <div className="glass-light p-3">
                <div className="text-caption text-[#666] text-[10px]">DATE</div>
                <div className="stat-value text-white">{monthNames[month - 1]} {year}</div>
              </div>
            </div>
            
            {/* Speed controls */}
            <div className="flex items-center justify-center gap-2 mt-4 mb-4">
              {[0, 1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
                  className={`p-3 transition-all ${
                    speed === s ? 'bg-white text-black' : 'glass-light text-[#666]'
                  }`}
                >
                  {s === 0 ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setShowShop(true);
                setShowMobileMenu(false);
              }}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              BUILD
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
          <div className="flex items-center gap-2 bg-[#c8ff00] text-black px-4 py-2 glow-volt">
            <IconZap className="w-4 h-4" />
            <span className="text-caption text-xs">{boostMultiplier}X BOOST</span>
          </div>
        </motion.div>
      )}
    </>
  );
}
