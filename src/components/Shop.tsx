'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { BUILDINGS, SHOP_ITEMS, BOOSTS, getBuildingsByCategory } from '@/lib/buildings';
import { Building, Rarity, BuildingCategory } from '@/lib/types';
import {
  X,
  Coins,
  Diamond,
  Zap,
  Lock,
  Crown,
  Star,
  Building2,
  Wallet,
  Image,
  Radio,
  PartyPopper,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: Building2 },
  { id: 'residential', name: 'Residential', icon: Building2 },
  { id: 'commercial', name: 'Commerce', icon: Wallet },
  { id: 'industrial', name: 'Industrial', icon: Image },
  { id: 'infrastructure', name: 'Infra', icon: Building2 },
  { id: 'entertainment', name: 'Fun', icon: PartyPopper },
  { id: 'services', name: 'Services', icon: Radio },
  { id: 'premium', name: 'Premium', icon: Crown },
] as const;

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'from-gray-500 to-gray-600',
  uncommon: 'from-green-500 to-emerald-600',
  rare: 'from-blue-500 to-indigo-600',
  epic: 'from-purple-500 to-violet-600',
  legendary: 'from-amber-400 to-yellow-500',
};

const RARITY_BORDERS: Record<Rarity, string> = {
  common: 'border-gray-500/30',
  uncommon: 'border-green-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-amber-400/50',
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
    addPremium,
  } = useGameStore();
  
  const [selectedItem, setSelectedItem] = useState<Building | null>(null);
  
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
    // In a real app, this would open a payment modal
    // For demo, we'll simulate a purchase
    addCast(item.castAmount);
    alert(`Thanks for your purchase! Added ${formatNumber(item.castAmount)} Coins`);
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
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setShowShop(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Claudity Shop</h2>
                  <p className="text-violet-300 text-sm">Build your dream city</p>
                </div>
              </div>
              
              {/* Currency Display */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl">
                  <Coins className="w-5 h-5 text-violet-400" />
                  <span className="font-bold text-white">{formatNumber(cast)}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl">
                  <Diamond className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white">{formatNumber(premium)}</span>
                </div>
                <button
                  onClick={() => setShowShop(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mt-4">
              {(['buildings', 'currency', 'boosts', 'premium'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setShopTab(tab)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    shopTab === tab
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {tab === 'buildings' && <Building2 className="w-4 h-4 inline mr-2" />}
                  {tab === 'currency' && <Coins className="w-4 h-4 inline mr-2" />}
                  {tab === 'boosts' && <Zap className="w-4 h-4 inline mr-2" />}
                  {tab === 'premium' && <Crown className="w-4 h-4 inline mr-2" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setBuildingCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                        buildingCategory === cat.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <cat.icon className="w-4 h-4" />
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
                        whileHover={{ scale: 1.02 }}
                        className={`relative bg-gray-800/50 rounded-2xl overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-violet-500' : RARITY_BORDERS[building.rarity]
                        } ${isLocked ? 'opacity-60' : ''}`}
                      >
                        {/* Rarity Banner */}
                        <div className={`h-1.5 bg-gradient-to-r ${RARITY_COLORS[building.rarity]}`} />
                        
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div 
                              className="w-14 h-14 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: building.color + '30' }}
                            >
                              <div 
                                className="w-10 h-10 rounded-lg"
                                style={{ 
                                  backgroundColor: building.color,
                                  boxShadow: `0 0 20px ${building.color}40`
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              {building.animation === 'sparkle' && (
                                <Sparkles className="w-4 h-4 text-amber-400" />
                              )}
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${RARITY_COLORS[building.rarity]} text-white`}>
                                {building.rarity}
                              </span>
                            </div>
                          </div>
                          
                          {/* Info */}
                          <h3 className="font-bold text-white text-lg">{building.name}</h3>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{building.description}</p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1 text-emerald-400">
                              <Coins className="w-4 h-4" />
                              <span>+{building.income}/hr</span>
                            </div>
                            <div className="flex items-center gap-1 text-violet-400">
                              <Star className="w-4 h-4" />
                              <span>{building.socialBoost}x</span>
                            </div>
                          </div>
                          
                          {/* Size */}
                          <div className="text-xs text-gray-500 mt-2">
                            Size: {building.size.width}x{building.size.height}
                          </div>
                          
                          {/* Price & Action */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Coins className="w-5 h-5 text-violet-400" />
                              <span className={`font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>
                                {formatNumber(building.price)}
                              </span>
                              {building.premiumPrice && (
                                <span className="text-xs text-gray-500">
                                  or ${building.premiumPrice}
                                </span>
                              )}
                            </div>
                            
                            {isLocked ? (
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Lock className="w-4 h-4" />
                                Level {building.unlockLevel}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleBuyBuilding(building)}
                                disabled={!canAfford}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                  canAfford
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  'Select'
                                )}
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
                    whileHover={{ scale: 1.02 }}
                    className={`relative bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-2xl p-6 border ${
                      item.popular ? 'border-amber-400' : 'border-violet-500/30'
                    }`}
                  >
                    {item.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 rounded-full text-xs font-bold text-black">
                        MOST POPULAR
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                        <Coins className="w-8 h-8 text-white" />
                      </div>
                      
                      <h3 className="font-bold text-white text-xl">{item.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                      
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-white">{formatNumber(item.castAmount)}</span>
                        <span className="text-violet-400 ml-1">Coins</span>
                        {item.bonus && (
                          <span className="ml-2 text-green-400 text-sm font-bold">+{item.bonus}% bonus!</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleBuyCurrency(item)}
                        className="w-full mt-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 rounded-2xl p-6 border border-amber-500/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                          <Zap className="w-7 h-7 text-white" />
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-bold text-amber-400">{boost.multiplier}x</span>
                          <div className="text-gray-400 text-sm">{boost.duration}h duration</div>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-white text-xl mt-4">{boost.name}</h3>
                      <p className="text-gray-400 mt-1">{boost.description}</p>
                      
                      <button
                        onClick={() => handleBuyBoost(boost)}
                        disabled={!canAfford}
                        className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-5 h-5" />
                        {formatNumber(boost.price)} Coins
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
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-4">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Premium Buildings</h3>
                  <p className="text-gray-400 mt-2">Exclusive legendary buildings only available for purchase</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {BUILDINGS.filter(b => b.premiumPrice).map((building) => (
                    <motion.div
                      key={building.id}
                      whileHover={{ scale: 1.02 }}
                      className="relative bg-gradient-to-br from-amber-900/20 to-yellow-900/20 rounded-2xl overflow-hidden border-2 border-amber-400/50"
                    >
                      <div className="h-2 bg-gradient-to-r from-amber-400 to-yellow-500" />
                      
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-20 h-20 rounded-xl flex items-center justify-center relative"
                            style={{ backgroundColor: building.color + '30' }}
                          >
                            <div 
                              className="w-14 h-14 rounded-lg"
                              style={{ 
                                backgroundColor: building.color,
                                boxShadow: `0 0 30px ${building.color}60`
                              }}
                            />
                            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-xl">{building.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{building.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 mt-4 text-sm">
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Coins className="w-4 h-4" />
                            <span>+{formatNumber(building.income)}/hr</span>
                          </div>
                          <div className="flex items-center gap-1 text-violet-400">
                            <Star className="w-4 h-4" />
                            <span>{building.socialBoost}x boost</span>
                          </div>
                          <div className="text-gray-500">
                            {building.size.width}x{building.size.height}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                          <div>
                            <span className="text-gray-500 text-sm">or {formatNumber(building.price)} Coins</span>
                          </div>
                          <button className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                            <Diamond className="w-5 h-5" />
                            ${building.premiumPrice}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Premium Pass */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="mt-8 bg-gradient-to-r from-violet-900/50 via-purple-900/50 to-pink-900/50 rounded-3xl p-8 border border-violet-400/50"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-4xl">👑</span>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white">Claudity Premium Pass</h3>
                      <p className="text-gray-300 mt-2">
                        Unlock exclusive benefits: 2x income permanently, early access to new buildings, 
                        exclusive cosmetics, and monthly coin bonuses!
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                        <span className="bg-violet-500/30 text-violet-300 px-3 py-1 rounded-full text-sm">2x Income</span>
                        <span className="bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-sm">Early Access</span>
                        <span className="bg-pink-500/30 text-pink-300 px-3 py-1 rounded-full text-sm">Exclusive Items</span>
                        <span className="bg-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-sm">Monthly Bonuses</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-gray-500 line-through">$9.99/mo</div>
                      <div className="text-3xl font-bold text-white">$4.99<span className="text-lg text-gray-400">/mo</span></div>
                      <button className="mt-2 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl transition-all">
                        Subscribe Now
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
