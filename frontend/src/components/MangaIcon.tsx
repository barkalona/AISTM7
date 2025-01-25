import { useEffect, useRef } from 'react';

interface MangaIconProps {
  name: 'ai-analysis' | 'risk-management' | 'monitoring';
  className?: string;
}

export default function MangaIcon({ name, className = '' }: MangaIconProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Add random spark effects
    const addSparks = () => {
      if (!svgRef.current) return;
      
      const svg = svgRef.current;
      const spark = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      // Random position around the icon
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      const x = 25 + Math.cos(angle) * radius;
      const y = 25 + Math.sin(angle) * radius;
      
      spark.setAttribute('cx', x.toString());
      spark.setAttribute('cy', y.toString());
      spark.setAttribute('r', '1');
      spark.setAttribute('fill', 'currentColor');
      spark.setAttribute('class', 'animate-spark');
      
      svg.appendChild(spark);
      
      // Remove spark after animation
      setTimeout(() => spark.remove(), 1000);
    };

    const interval = setInterval(addSparks, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg
      ref={svgRef}
      className={`w-12 h-12 ${className}`}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <use href={`/images/manga-icons.svg#${name}`} className="text-current" />
      
      {/* Action Effects Container */}
      <g className="action-effects">
        {/* Energy Ring */}
        <circle
          cx="25"
          cy="25"
          r="20"
          className="animate-pulse-fast"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          fill="none"
        />
        
        {/* Speed Lines */}
        <g className="speed-lines">
          {[...Array(8)].map((_, i) => (
            <line
              key={i}
              x1="25"
              y1="25"
              x2={25 + Math.cos((i * Math.PI) / 4) * 30}
              y2={25 + Math.sin((i * Math.PI) / 4) * 30}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.3"
              className="animate-fade-out"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </g>
      </g>

      <style jsx>{`
        @keyframes spark {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(0);
            opacity: 0;
          }
        }

        .animate-spark {
          animation: spark 1s ease-out forwards;
        }

        @keyframes fade-out {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        .animate-fade-out {
          animation: fade-out 1s ease-out infinite;
        }
      `}</style>
    </svg>
  );
}