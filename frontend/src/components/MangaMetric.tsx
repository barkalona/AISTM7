import { useEffect, useState } from 'react';

interface MangaMetricProps {
  value: number;
  formatter: (n: number) => string;
  label: string;
}

export default function MangaMetric({ value, formatter, label }: MangaMetricProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    
    setIsAnimating(true);
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        current = value;
        clearInterval(timer);
        setIsAnimating(false);
      }
      setDisplayValue(current);
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative group">
      {/* Card Background */}
      <div className="relative p-6 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-blue-500/20 shadow-xl transition-all duration-500 hover:-translate-y-1">
        {/* Manga-style corner accents */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-500/50" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-500/50" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-500/50" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-500/50" />

        {/* Content */}
        <div className="relative z-10">
          <p className="text-sm text-slate-600 mb-1 font-mono">{label}</p>
          <div className="relative">
            <p className="text-3xl font-bold font-mono bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {formatter(displayValue)}
            </p>
            
            {/* Manga-style effects */}
            {isAnimating && (
              <>
                {/* Speed lines */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-px bg-blue-500/20"
                      style={{
                        left: '-100%',
                        top: `${20 + i * 20}%`,
                        width: '300%',
                        transform: 'rotate(-45deg)',
                        animation: `slideRight 1s ${i * 0.1}s linear infinite`
                      }}
                    />
                  ))}
                </div>

                {/* Energy particles */}
                <div className="absolute inset-0">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-500 rounded-full animate-ping"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${0.8 + Math.random() * 0.4}s`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {/* Tech grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1)_1px,transparent_1px)] bg-[length:10px_10px]" />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5" />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideRight {
          from {
            transform: translateX(-100%) rotate(-45deg);
          }
          to {
            transform: translateX(100%) rotate(-45deg);
          }
        }
      `}</style>
    </div>
  );
}