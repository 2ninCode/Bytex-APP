import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-semibold py-1.5 px-4 w-full">
            <WifiOff className="size-3.5 shrink-0 animate-pulse" />
            <span>Sem conexão — os dados exibidos podem estar desatualizados</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
