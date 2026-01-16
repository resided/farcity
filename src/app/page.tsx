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

// Nike-inspired logo mark
function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <path d="M10 70 L30 30 L50 50 L70 20 L90 40 L70 60 L50 45 L30 70 Z" />
      <rect x="20" y="72" width="60" height="4" />
    </svg>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 80);
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 grid-lines opacity-30" />
        
        {/* Scan line effect */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8ff00] to-transparent"
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        
        <div className="text-center relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
          >
            <LogoMark className="w-20 h-20 mx-auto text-white mb-8" />
            <h1 className="text-display text-6xl md:text-8xl text-white tracking-tighter">
              FARCITY
            </h1>
            <div className="h-1 w-32 mx-auto mt-4 bg-gradient-to-r from-[#c8ff00] to-[#00ffff]" />
          </motion.div>
          
          {/* Loading Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-80 mx-auto"
          >
            <div className="h-1 bg-[#1a1a1a] overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-3">
              <span className="text-caption text-[#666]">
                {loadingProgress < 100 ? 'LOADING' : 'READY'}
              </span>
              <span className="text-caption text-[#666]">
                {Math.min(Math.round(loadingProgress), 100)}%
              </span>
            </div>
          </motion.div>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-16 flex justify-center gap-12"
          >
            {[
              { label: 'BUILD', value: '01' },
              { label: 'GROW', value: '02' },
              { label: 'DOMINATE', value: '03' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-caption text-[#444] mb-1">{item.value}</div>
                <div className="text-headline text-sm text-white">{item.label}</div>
              </div>
            ))}
          </motion.div>
          
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-caption text-[#666] mt-16"
          >
            JUST BUILD IT
          </motion.p>
        </div>
      </div>
    );
  }
  
  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none grid-lines opacity-10" />
      
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
        <div className="glass-dark px-4 py-3 max-w-xs">
          <p className="text-body text-sm text-[#a0a0a0]">
            <span className="text-[#c8ff00] font-semibold">TIP</span> 
            {' '}Drag to pan. Click + to build.
          </p>
        </div>
      </motion.div>
      
      {/* Version tag */}
      <div className="fixed bottom-4 left-4 z-40">
        <span className="tag">V 0.1.0</span>
      </div>
    </main>
  );
}
