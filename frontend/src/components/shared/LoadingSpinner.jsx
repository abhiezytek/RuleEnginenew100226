import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const LoadingSpinner = ({ size = 'default', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-8" data-testid="loading-spinner">
      <Loader2 className={cn("animate-spin text-sky-600", sizeClasses[size], className)} />
    </div>
  );
};

export const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]" data-testid="page-loader">
      <Loader2 className="w-10 h-10 animate-spin text-sky-600 mb-4" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );
};
