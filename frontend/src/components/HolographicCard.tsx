import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  delay?: number;
}

const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  className,
  glowIntensity = 'medium',
  interactive = false,
  delay = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (interactive && cardRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        const card = cardRef.current!;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      };
      cardRef.current.addEventListener('mousemove', handleMouseMove);
      return () => cardRef.current?.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive]);

  return (
    <div
      ref={cardRef}
      className={clsx(
        'relative p-4 rounded-xl backdrop-blur-md border border-opacity-30 overflow-hidden',
        {
          'border-[#59CBE8]': glowIntensity === 'low',
          'border-[#59CBE8] border-opacity-60': glowIntensity === 'medium',
          'border-[#59CBE8] border-opacity-100': glowIntensity === 'high',
          'cursor-pointer': interactive,
        },
        'bg-[rgba(30,41,59,0.1)] before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#59CBE8] before:via-transparent before:to-[#59CBE8] before:opacity-50 before:rounded-xl before:blur-lg before:z-[-1] before:animate-gradient-move',
        className
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default HolographicCard;