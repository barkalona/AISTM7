import { useState } from 'react';
import MangaIcon from './MangaIcon';

interface MangaFeatureCardProps {
  icon: 'ai-analysis' | 'risk-management' | 'monitoring';
  title: string;
  description: string;
}

export default function MangaFeatureCard({ icon, title, description }: MangaFeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Background */}
      <div className="relative p-6 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-blue-500/20 shadow-xl transition-all duration-500 group-hover:-translate-y-2">
        {/* Manga-style corner accents */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Icon Container */}
        <div className="relative mb-4 group-hover:scale-110 transition-transform duration-500">
          <div className="relative w-12 h-12 bg-gradient-to-br from-blue-50 to-white rounded-lg flex items-center justify-center">
            <MangaIcon
              name={icon}
              className="text-blue-600 transform transition-transform duration-300 group-hover:scale-110"
            />
            {/* Icon glow effect */}
            <div className="absolute inset-0 bg-blue-500/10 rounded-lg filter blur-sm group-hover:blur-md transition-all" />
          </div>
          
          {/* Manga-style action lines */}
          {isHovered && (
            <div className="absolute -inset-2">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 border border-blue-500/20"
                  style={{
                    transform: `rotate(${i * 45}deg) scale(${1 + i * 0.1})`,
                    opacity: 1 - i * 0.1,
                    animation: `expandOut 0.5s ease-out forwards ${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-2 font-mono bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-slate-600">
            {description}
          </p>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {/* Tech grid pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1)_1px,transparent_1px)] bg-[length:10px_10px]" />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5" />
        </div>
      </div>

      {/* Manga-style speech bubble on hover */}
      <div
        className={`absolute -right-4 top-0 transform transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
        }`}
      >
        <div className="relative bg-white px-3 py-1 rounded-lg border border-blue-500/20 shadow-lg">
          <p className="text-sm text-blue-600 font-mono">Click to learn more!</p>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-l border-b border-blue-500/20 transform rotate-45" />
        </div>
      </div>

      <style jsx>{`
        @keyframes expandOut {
          from {
            transform: rotate(var(--rotation)) scale(0.8);
            opacity: 0;
          }
          to {
            transform: rotate(var(--rotation)) scale(1);
            opacity: var(--final-opacity);
          }
        }
      `}</style>
    </div>
  );
}