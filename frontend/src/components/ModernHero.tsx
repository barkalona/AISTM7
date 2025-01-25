"use client";

import HexagonGrid from './HexagonGrid';
import DataVisualizations from './DataVisualizations';
import MangaCharacter from './MangaCharacter';

export default function ModernHero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b0f]">
      {/* Background Effects */}
      <HexagonGrid className="opacity-15" />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(89,203,232,0.05)] via-transparent to-[rgba(45,136,255,0.05)]" />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text & UI */}
          <div className="relative z-10 space-y-8">
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] bg-clip-text text-transparent animate-glow">
                  Blockchain
                </span>
                <br />
                <span className="text-white neon-text">
                  Portfolio Analysis
                </span>
              </h1>
              <p className="text-lg text-[rgba(89,203,232,0.8)] max-w-lg leading-relaxed">
                Level up your trading game with AI-powered insights and real-time market analysis.
                Join the future of blockchain trading.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-all duration-500" />
                <div className="relative px-8 py-4 bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] rounded-lg overflow-hidden">
                  <span className="relative z-10 text-white font-semibold">Get Started</span>
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </div>
              </button>

              <button className="relative group">
                <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
                  <span className="relative z-10 text-white font-semibold">Learn More</span>
                  <div className="absolute inset-0 bg-[#59CBE8]/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                </div>
              </button>
            </div>

            {/* Floating UI Elements */}
            <div className="absolute -right-20 top-0 animate-float" style={{ animationDelay: '0.2s' }}>
              <DataVisualizations />
            </div>
          </div>

          {/* Right Column - Character & UI */}
          <div className="relative h-[600px]">
            {/* Main Character */}
            <MangaCharacter className="absolute inset-0 flex items-center justify-center" />

            {/* Floating UI Elements */}
            <div className="absolute -right-10 bottom-20 animate-float" style={{ animationDelay: '0.7s' }}>
              <DataVisualizations className="transform scale-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Tech Lines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-[rgba(89,203,232,0.2)] to-transparent" />
        <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-[rgba(89,203,232,0.2)] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[rgba(89,203,232,0.2)] to-transparent" />
      </div>

      {/* Scan Line Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 scan-line opacity-20" />
      </div>

      {/* Status Indicators */}
      <div className="fixed top-1/4 right-8 hidden lg:block">
        <div className="glass-panel p-4 rounded-lg animate-float" style={{ animationDelay: '0.2s' }}>
          <div className="text-sm font-mono text-[rgba(89,203,232,0.8)]">
            <div className="opacity-60">System Status</div>
            <div className="font-bold text-[rgba(89,203,232,1)] animate-pulse">OPERATIONAL</div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-8 hidden lg:block">
        <div className="glass-panel p-4 rounded-lg animate-float" style={{ animationDelay: '0.4s' }}>
          <div className="text-sm font-mono text-[rgba(89,203,232,0.8)]">
            <div className="opacity-60">Network</div>
            <div className="font-bold text-[rgba(89,203,232,1)] animate-pulse">SECURE</div>
          </div>
        </div>
      </div>
    </div>
  );
}