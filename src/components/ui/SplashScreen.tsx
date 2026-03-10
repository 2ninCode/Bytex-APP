import React from 'react';
import { motion } from 'motion/react';
import { BytexIcon } from './BytexIcon';

export const SplashScreen = () => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[999] bg-slate-950 flex flex-col items-center justify-center p-6"
    >
      <div className="relative">
        {/* Glow effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.2, scale: 1.5 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
          className="absolute inset-0 bg-primary blur-[60px] rounded-full"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          className="size-32 relative z-10 p-2"
        >
          <BytexIcon className="size-full drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-8 text-center"
      >
        <h1 className="text-white text-3xl font-black tracking-tighter mb-2">Bytex</h1>
        <div className="flex items-center gap-2 justify-center">
            <span className="h-0.5 w-4 bg-primary/40 rounded-full" />
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Sistemas Inteligentes</p>
            <span className="h-0.5 w-4 bg-primary/40 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
};
