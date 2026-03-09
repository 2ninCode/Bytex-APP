import React from 'react';
import { cn } from './utils';

export const Card = ({ children, className = '', ...props }: any) => (
  <div className={cn('bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden', className)} {...props}>
    {children}
  </div>
);
