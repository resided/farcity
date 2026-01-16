'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { getBuildingById } from '@/lib/buildings';
import { X } from 'lucide-react';

export default function BuildingPanel() {
  const {
    selectedBuilding,
    selectBuilding,
    cast,
  } = useGameStore();
  
  const building = selectedBuilding ? getBuildingById(selectedBuilding) : null;
  
  if (!building) return null;
  
  const canAfford = cast >= building.price;
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="glass-dark p-4 flex items-center gap-4">
          {/* Building Preview */}
          <div 
            className="w-14 h-14 flex items-center justify-center"
            style={{ backgroundColor: building.color + '30' }}
          >
            <div 
              className="w-8 h-8"
              style={{ backgroundColor: building.color }}
            />
          </div>
          
          {/* Info */}
          <div>
            <h3 className="text-headline text-sm text-white">{building.name}</h3>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-caption text-[10px] text-[#00ff88]">
                +{formatNumber(building.income)}/HR
              </span>
              <span className="text-caption text-[10px] text-[#00ffff]">
                {building.socialBoost}X BOOST
              </span>
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-10 bg-[#2a2a2a]" />
          
          {/* Price */}
          <div className="text-center">
            <div className="text-caption text-[10px] text-[#666]">COST</div>
            <div className={`stat-value text-sm ${canAfford ? 'text-white' : 'text-[#ff3366]'}`}>
              ${formatNumber(building.price)}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-10 bg-[#2a2a2a]" />
          
          {/* Instructions */}
          <div className="text-caption text-[10px] text-[#666] max-w-[120px]">
            CLICK GRID TO PLACE
          </div>
          
          {/* Cancel Button */}
          <button
            onClick={() => selectBuilding(null)}
            className="p-3 glass-dark hover:bg-[#ff3366]/20 hover:text-[#ff3366] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
