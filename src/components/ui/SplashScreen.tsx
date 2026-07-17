import React from 'react';
import { motion } from 'motion/react';

export const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-6"
    >
      <div className="relative">
        {/* Glow sutil e rápido */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1.2 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 bg-primary blur-[50px] rounded-full"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="size-28 relative z-10 p-2"
        >
          <img src="/pwa-192x192.png" alt="Bytex Logo" className="size-full object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
        className="mt-6 text-center"
      >
        <h1 className="text-white text-2xl font-black tracking-tighter mb-1">Bytex</h1>
        <div className="flex items-center gap-2 justify-center">
          <span className="h-px w-4 bg-primary/40 rounded-full" />
          <p className="text-primary text-[9px] font-black uppercase tracking-[0.3em]">Sistemas Inteligentes</p>
          <span className="h-px w-4 bg-primary/40 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
};
