import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

interface MangaCharacterProps {
  className?: string;
  glowColor?: string;
  animationDelay?: number;
  interactive?: boolean;
}

const MangaCharacter: React.FC<MangaCharacterProps> = ({
  className = '',
  glowColor = '#59CBE8',
  animationDelay = 0,
  interactive = false,
}) => {
  const characterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (interactive && characterRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const character = characterRef.current!;
        const rect = character.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        character.style.setProperty('--x', `${x}px`);
        character.style.setProperty('--y', `${y}px`);
      };
      characterRef.current.addEventListener('mousemove', handleMouseMove);
      return () => characterRef.current?.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive]);

  return (
    <div
      ref={characterRef}
      className={clsx(
        'relative flex items-center justify-center w-[500px] h-[500px]',
        'before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-tr',
        'before:from-transparent before:via-[#59CBE8] before:to-transparent',
        'before:opacity-20 before:blur-2xl before:animate-pulse-slow',
        'after:absolute after:inset-0 after:rounded-full',
        'after:border after:border-opacity-30 after:border-[#59CBE8] after:animate-float',
        className
      )}
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Character Image */}
      <div className="relative z-10 w-[400px] h-[400px] animate-float" style={{ animationDelay: '0.2s' }}>
        <Image
          src="/images/manga-agent.svg"
          alt="Manga Character"
          fill
          style={{ objectFit: 'contain' }}
          className="drop-shadow-[0_0_20px_rgba(89,203,232,0.3)]"
          priority
        />
      </div>

      {/* Floating UI Elements */}
      <div className="absolute inset-0">
        {/* Top Right Data Point */}
        <div className="absolute top-10 right-10 w-24 h-16 bg-[#1E293B] bg-opacity-50 backdrop-blur-md border border-[#59CBE8] rounded-xl animate-float" style={{ animationDelay: '0.3s' }}>
          <div className="p-2 text-center">
            <div className="text-xs text-[#59CBE8] opacity-70">Portfolio</div>
            <div className="text-lg text-[#59CBE8]">$45.2K</div>
          </div>
        </div>

        {/* Bottom Left Data Point */}
        <div className="absolute bottom-20 left-10 w-20 h-20 bg-[#1E293B] bg-opacity-50 backdrop-blur-md border border-[#59CBE8] rounded-full animate-spin-slow">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[#59CBE8] font-mono">85%</div>
          </div>
        </div>

        {/* Floating Particles */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[#59CBE8] animate-pulse-slow"
            style={{
              top: `${20 + i * 15}%`,
              left: `${80 + Math.sin(i) * 10}%`,
              animationDelay: `${i * 0.2}s`,
              filter: 'blur(2px)',
            }}
          />
        ))}

        {/* Data Flow Lines */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px w-32 animate-stream"
            style={{
              top: `${30 + i * 20}%`,
              right: '-20%',
              background: 'linear-gradient(90deg, transparent, #59CBE8, transparent)',
              animationDelay: `${i * 0.3}s`,
              transform: 'rotate(-45deg)',
            }}
          />
        ))}
      </div>

      {/* Holographic Scanlines */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-[#59CBE8]"
            style={{
              top: `${i * 5}%`,
              transform: 'translateY(-50%)',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MangaCharacter;