'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Dynamic imports to avoid SSR issues with canvas
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false });
const GameHUD = dynamic(() => import('@/components/GameHUD'), { ssr: false });
const Shop = dynamic(() => import('@/components/Shop'), { ssr: false });
const BuildingPanel = dynamic(() => import('@/components/BuildingPanel'), { ssr: false });
const QuickBar = dynamic(() => import('@/components/QuickBar'), { ssr: false });

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-violet-500/50 mb-6">
              <span className="text-6xl">🏙️</span>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400">
              Claudity
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Build Your Empire</p>
          </motion.div>
          
          {/* Loading Bar */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-gray-500 text-sm mt-2">
              {loadingProgress < 30 && 'Initializing city...'}
              {loadingProgress >= 30 && loadingProgress < 60 && 'Loading buildings...'}
              {loadingProgress >= 60 && loadingProgress < 90 && 'Preparing your empire...'}
              {loadingProgress >= 90 && 'Ready to build!'}
            </div>
          </div>
          
          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto"
          >
            {[
              { icon: '🏗️', label: 'Build' },
              { icon: '💰', label: 'Earn' },
              { icon: '🚀', label: 'Grow' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }
  
  return (
    <main className="relative min-h-screen bg-[#0a0a12] overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-purple-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Game Canvas */}
      <GameCanvas />
      
      {/* UI Layers */}
      <GameHUD />
      <QuickBar />
      <BuildingPanel />
      <Shop />
      
      {/* Help Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl px-4 py-3 border border-white/10 max-w-xs">
          <p className="text-gray-300 text-sm">
            <span className="text-violet-400 font-semibold">Tip:</span> Drag to pan the map. 
            Click the <span className="text-violet-400">+</span> button to build!
          </p>
        </div>
      </motion.div>
    </main>
  );
}
