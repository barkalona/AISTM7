import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function MangaHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add parallax effect on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { width, height, left, top } = containerRef.current.getBoundingClientRect();
      
      const x = (clientX - left) / width - 0.5;
      const y = (clientY - top) / height - 0.5;
      
      const elements = containerRef.current.querySelectorAll('.parallax');
      elements.forEach((el) => {
        const speed = el.getAttribute('data-speed') || '20';
        const moveX = x * parseInt(speed);
        const moveY = y * parseInt(speed);
        (el as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/images/manga-hero.svg')] bg-no-repeat bg-right-top bg-contain opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-white/40" />
      </div>

      {/* Floating UI Elements */}
      <div className="absolute right-20 top-40 parallax" data-speed="30">
        <div className="relative p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-500/20 shadow-lg animate-float">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg" />
          <div className="text-blue-600 font-mono">
            <div className="text-sm opacity-70">Portfolio Risk Score</div>
            <div className="text-2xl font-bold">92.4%</div>
          </div>
          <div className="absolute -right-2 -top-2 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
        </div>
      </div>

      <div className="absolute right-40 top-80 parallax" data-speed="20">
        <div className="relative p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-500/20 shadow-lg animate-float-delayed">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-lg" />
          <div className="text-purple-600 font-mono">
            <div className="text-sm opacity-70">AI Analysis</div>
            <div className="text-xl font-bold">Active</div>
          </div>
        </div>
      </div>

      {/* Manga Speech Bubble */}
      <div className="absolute left-20 top-60 parallax" data-speed="10">
        <div className="relative">
          <div className="manga-bubble p-6 bg-white rounded-3xl shadow-xl border-2 border-blue-500">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-mono">
              AI-Powered Portfolio Analysis!
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Optimize your investments with manga-style precision! ✨
            </p>
          </div>
          <div className="absolute -bottom-4 right-8 w-8 h-8 bg-white border-r-2 border-b-2 border-blue-500 transform rotate-45" />
        </div>
      </div>

      {/* Action Effects */}
      <div className="absolute right-60 top-60 parallax" data-speed="15">
        <div className="relative">
          <div className="manga-effect">
            <div className="absolute inset-0 animate-spin-slow">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-20 bg-gradient-to-t from-blue-500/0 via-blue-500/30 to-blue-500/0"
                  style={{ transform: `rotate(${i * 45}deg) translateY(-60px)` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tech Grid Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
      </div>

      <style jsx>{`
        .manga-bubble {
          clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 80% 80%, 70% 100%, 60% 80%, 0% 80%);
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .manga-effect {
          width: 120px;
          height: 120px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}