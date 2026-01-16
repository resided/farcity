'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { getBuildingById } from '@/lib/buildings';
import { X, Coins, Star, ArrowUp, Trash2 } from 'lucide-react';

export default function BuildingPanel() {
  const {
    selectedBuilding,
    selectBuilding,
    buildings,
    cast,
  } = useGameStore();
  
  const building = selectedBuilding ? getBuildingById(selectedBuilding) : null;
  
  if (!building) return null;
  
  const canAfford = cast >= building.price;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl flex items-center gap-4">
          {/* Building Preview */}
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center"
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
          
          {/* Info */}
          <div>
            <h3 className="font-bold text-white">{building.name}</h3>
            <div className="flex items-center gap-3 text-sm mt-1">
              <div className="flex items-center gap-1 text-emerald-400">
                <Coins className="w-3.5 h-3.5" />
                <span>+{building.income}/hr</span>
              </div>
              <div className="flex items-center gap-1 text-violet-400">
                <Star className="w-3.5 h-3.5" />
                <span>{building.socialBoost}x</span>
              </div>
            </div>
          </div>
          
          {/* Price */}
          <div className="flex items-center gap-2 bg-violet-900/50 px-3 py-2 rounded-xl">
            <Coins className="w-4 h-4 text-violet-400" />
            <span className={`font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>
              {building.price.toLocaleString()}
            </span>
          </div>
          
          {/* Instructions */}
          <div className="text-gray-400 text-sm max-w-[150px]">
            Click on the grid to place this building
          </div>
          
          {/* Cancel Button */}
          <button
            onClick={() => selectBuilding(null)}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
