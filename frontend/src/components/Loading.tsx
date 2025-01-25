import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingButton({ text = 'Loading', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-full border-2 border-blue-500 border-t-transparent animate-spin`} />
      <span className="text-blue-400 font-mono text-sm">{text}</span>
    </div>
  );
}

export default function Loading({ fullScreen = true, text = 'Initializing System' }: LoadingProps) {
  if (!fullScreen) {
    return <LoadingButton text={text} />;
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f1c] flex items-center justify-center z-50">
      <div className="relative">
        {/* Animated circles */}
        <div className="absolute inset-0 animate-ping">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/20" />
        </div>
        <div className="absolute inset-0 animate-pulse">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/40" />
        </div>
        
        {/* Core loading spinner */}
        <div className="w-16 h-16 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        
        {/* Tech circuit pattern */}
        <div className="absolute inset-0 tech-circuit opacity-20" />
        
        {/* Scan line effect */}
        <div className="absolute inset-0">
          <div className="auth-scan" />
        </div>
        
        {/* Loading text */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-blue-400 font-mono text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
}