'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { BUILDINGS, SHOP_ITEMS, BOOSTS, getBuildingsByCategory } from '@/lib/buildings';
import { Building, Rarity, BuildingCategory } from '@/lib/types';
import {
  X,
  Lock,
  Check,
  ChevronRight,
  Plus,
  Zap,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'ALL' },
  { id: 'residential', name: 'RES' },
  { id: 'commercial', name: 'COM' },
  { id: 'industrial', name: 'IND' },
  { id: 'infrastructure', name: 'INFRA' },
  { id: 'entertainment', name: 'ENT' },
  { id: 'services', name: 'SVC' },
  { id: 'premium', name: 'PRO' },
] as const;

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'bg-[#3a3a3a]',
  uncommon: 'bg-[#00aa55]',
  rare: 'bg-[#0066cc]',
  epic: 'bg-[#8800cc]',
  legendary: 'bg-[#cc8800]',
};

const RARITY_BORDERS: Record<Rarity, string> = {
  common: 'border-[#3a3a3a]',
  uncommon: 'border-[#00aa55]',
  rare: 'border-[#0066cc]',
  epic: 'border-[#8800cc]',
  legendary: 'border-[#cc8800]',
};

export default function Shop() {
  const {
    showShop,
    setShowShop,
    shopTab,
    setShopTab,
    buildingCategory,
    setBuildingCategory,
    cast,
    premium,
    level,
    selectBuilding,
    selectedBuilding,
    activateBoost,
    addCast,
  } = useGameStore();
  
  const filteredBuildings = buildingCategory === 'all' 
    ? BUILDINGS 
    : getBuildingsByCategory(buildingCategory as BuildingCategory);
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };
  
  const handleBuyBuilding = (building: Building) => {
    if (building.unlockLevel > level) return;
    if (cast < building.price) return;
    
    selectBuilding(building.id);
    setShowShop(false);
  };
  
  const handleBuyCurrency = (item: typeof SHOP_ITEMS[0]) => {
    addCast(item.castAmount);
  };
  
  const handleBuyBoost = (boost: typeof BOOSTS[0]) => {
    if (cast < boost.price) return;
    activateBoost(boost);
  };
  
  if (!showShop) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setShowShop(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0a0a0a] w-full max-w-4xl max-h-[85vh] overflow-hidden border border-[#2a2a2a]"
        >
          {/* Header */}
          <div className="bg-black p-6 border-b border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-headline text-2xl text-white">BUILD</h2>
                <p className="text-caption text-[#666] mt-1">SELECT STRUCTURE</p>
              </div>
              
              {/* Currency Display */}
              <div className="flex items-center gap-4">
                <div className="glass-dark px-4 py-2 border-l-2 border-[#00ff88]">
                  <span className="text-caption text-[10px] text-[#666]">FUNDS</span>
                  <div className="stat-value text-white">${formatNumber(cast)}</div>
                </div>
                <div className="glass-dark px-4 py-2 border-l-2 border-[#c8ff00]">
                  <span className="text-caption text-[10px] text-[#666]">PREMIUM</span>
                  <div className="stat-value text-white">{formatNumber(premium)}</div>
                </div>
                <button
                  onClick={() => setShowShop(false)}
                  className="p-3 glass-dark hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mt-6">
              {(['buildings', 'currency', 'boosts', 'premium'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setShopTab(tab)}
                  className={`px-4 py-2 text-caption text-xs transition-all ${
                    shopTab === tab
                      ? 'bg-white text-black'
                      : 'glass-dark text-[#666] hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Buildings Tab */}
            {shopTab === 'buildings' && (
              <div>
                {/* Categories */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setBuildingCategory(cat.id)}
                      className={`px-4 py-2 text-caption text-xs whitespace-nowrap transition-all ${
                        buildingCategory === cat.id
                          ? 'bg-white text-black'
                          : 'glass-dark text-[#666] hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                
                {/* Building Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuildings.map((building) => {
                    const isLocked = building.unlockLevel > level;
                    const canAfford = cast >= building.price;
                    const isSelected = selectedBuilding === building.id;
                    
                    return (
                      <motion.div
                        key={building.id}
                        whileHover={{ scale: 1.01 }}
                        className={`relative bg-[#1a1a1a] border transition-all ${
                          isSelected ? 'border-white' : RARITY_BORDERS[building.rarity]
                        } ${isLocked ? 'opacity-50' : ''}`}
                      >
                        {/* Rarity Bar */}
                        <div className={`h-1 ${RARITY_COLORS[building.rarity]}`} />
                        
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div 
                              className="w-12 h-12 flex items-center justify-center"
                              style={{ backgroundColor: building.color + '30' }}
                            >
                              <div 
                                className="w-8 h-8"
                                style={{ backgroundColor: building.color }}
                              />
                            </div>
                            <span className={`tag text-[10px] ${RARITY_COLORS[building.rarity]}`}>
                              {building.rarity.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Info */}
                          <h3 className="text-headline text-sm text-white">{building.name}</h3>
                          <p className="text-body text-xs text-[#666] mt-1 line-clamp-2">
                            {building.description}
                          </p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-3">
                            <div className="text-caption text-[10px]">
                              <span className="text-[#00ff88]">+{building.income}</span>
                              <span className="text-[#666]">/HR</span>
                            </div>
                            <div className="text-caption text-[10px]">
                              <span className="text-[#00ffff]">{building.socialBoost}X</span>
                              <span className="text-[#666]"> BOOST</span>
                            </div>
                          </div>
                          
                          {/* Size */}
                          <div className="text-caption text-[10px] text-[#444] mt-2">
                            {building.size.width}X{building.size.height}
                          </div>
                          
                          {/* Price & Action */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
                            <div>
                              <span className={`stat-value text-sm ${canAfford ? 'text-white' : 'text-[#ff3366]'}`}>
                                ${formatNumber(building.price)}
                              </span>
                            </div>
                            
                            {isLocked ? (
                              <div className="flex items-center gap-2 text-[#666]">
                                <Lock className="w-4 h-4" />
                                <span className="text-caption text-xs">LVL {building.unlockLevel}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleBuyBuilding(building)}
                                disabled={!canAfford}
                                className={`px-4 py-2 text-caption text-xs transition-all ${
                                  canAfford
                                    ? 'btn-primary'
                                    : 'bg-[#2a2a2a] text-[#444] cursor-not-allowed'
                                }`}
                              >
                                {isSelected ? <Check className="w-4 h-4" /> : 'SELECT'}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Currency Tab */}
            {shopTab === 'currency' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SHOP_ITEMS.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    className={`relative bg-[#1a1a1a] p-6 border ${
                      item.popular ? 'border-[#c8ff00]' : 'border-[#2a2a2a]'
                    }`}
                  >
                    {item.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 tag tag-volt">
                        POPULAR
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#00ff88] to-[#00aa55] flex items-center justify-center mb-4">
                        <span className="text-headline text-xl text-black">$</span>
                      </div>
                      
                      <h3 className="text-headline text-lg text-white">{item.name}</h3>
                      <p className="text-body text-xs text-[#666] mt-1">{item.description}</p>
                      
                      <div className="mt-4">
                        <span className="stat-value text-2xl text-white">{formatNumber(item.castAmount)}</span>
                        <span className="text-caption text-xs text-[#666] ml-2">COINS</span>
                        {item.bonus && (
                          <span className="tag tag-volt ml-2 text-[10px]">+{item.bonus}%</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleBuyCurrency(item)}
                        className="w-full mt-4 btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        <span>${item.usdPrice}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Boosts Tab */}
            {shopTab === 'boosts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BOOSTS.map((boost) => {
                  const canAfford = cast >= boost.price;
                  
                  return (
                    <motion.div
                      key={boost.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-[#1a1a1a] p-6 border border-[#ffaa00]/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 bg-[#ffaa00] flex items-center justify-center">
                          <Zap className="w-7 h-7 text-black" />
                        </div>
                        <div className="text-right">
                          <span className="stat-value text-2xl text-[#ffaa00]">{boost.multiplier}X</span>
                          <div className="text-caption text-[10px] text-[#666]">{boost.duration}H</div>
                        </div>
                      </div>
                      
                      <h3 className="text-headline text-lg text-white mt-4">{boost.name}</h3>
                      <p className="text-body text-sm text-[#666] mt-1">{boost.description}</p>
                      
                      <button
                        onClick={() => handleBuyBoost(boost)}
                        disabled={!canAfford}
                        className={`w-full mt-4 py-3 flex items-center justify-center gap-2 text-caption text-xs ${
                          canAfford
                            ? 'bg-[#ffaa00] text-black hover:bg-[#cc8800]'
                            : 'bg-[#2a2a2a] text-[#444] cursor-not-allowed'
                        } transition-all`}
                      >
                        ${formatNumber(boost.price)} COINS
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {/* Premium Tab */}
            {shopTab === 'premium' && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#c8ff00] to-[#00ff88] flex items-center justify-center mb-4">
                    <span className="text-headline text-3xl text-black">PRO</span>
                  </div>
                  <h3 className="text-headline text-2xl text-white">PREMIUM STRUCTURES</h3>
                  <p className="text-body text-sm text-[#666] mt-2">Exclusive legendary buildings</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {BUILDINGS.filter(b => b.premiumPrice).map((building) => (
                    <motion.div
                      key={building.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-[#1a1a1a] border-2 border-[#c8ff00]/50"
                    >
                      <div className="h-1 bg-gradient-to-r from-[#c8ff00] to-[#00ff88]" />
                      
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-20 h-20 flex items-center justify-center"
                            style={{ backgroundColor: building.color + '30' }}
                          >
                            <div 
                              className="w-14 h-14"
                              style={{ backgroundColor: building.color }}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-headline text-lg text-white">{building.name}</h3>
                            <p className="text-body text-xs text-[#666] mt-1">{building.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4">
                          <div className="text-caption text-xs">
                            <span className="text-[#00ff88]">+{formatNumber(building.income)}</span>
                            <span className="text-[#666]">/HR</span>
                          </div>
                          <div className="text-caption text-xs">
                            <span className="text-[#00ffff]">{building.socialBoost}X</span>
                            <span className="text-[#666]"> BOOST</span>
                          </div>
                          <div className="text-caption text-xs text-[#444]">
                            {building.size.width}X{building.size.height}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2a2a2a]">
                          <span className="text-caption text-xs text-[#666]">
                            OR ${formatNumber(building.price)} COINS
                          </span>
                          <button className="btn-primary px-6 py-3 glow-volt">
                            ${building.premiumPrice}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Premium Pass */}
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  className="mt-8 bg-gradient-to-r from-[#1a1a1a] via-[#0a0a0a] to-[#1a1a1a] p-8 border border-[#c8ff00]/30"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#c8ff00] via-[#00ffff] to-[#ff00ff] flex items-center justify-center">
                      <span className="text-headline text-2xl text-black">VIP</span>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-headline text-xl text-white">FARCITY PRO</h3>
                      <p className="text-body text-sm text-[#a0a0a0] mt-2">
                        2X income. Early access. Exclusive items. Monthly bonuses.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        <span className="tag">2X INCOME</span>
                        <span className="tag">EARLY ACCESS</span>
                        <span className="tag">EXCLUSIVES</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-caption text-xs text-[#666] line-through">$9.99/MO</div>
                      <div className="stat-value text-2xl text-white">$4.99<span className="text-caption text-xs text-[#666]">/MO</span></div>
                      <button className="mt-2 btn-primary px-8 py-3 glow-volt">
                        SUBSCRIBE
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
