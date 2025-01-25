"use client";

import { useEffect, useRef } from 'react';
import HolographicCard from './HolographicCard';

interface DataVisualizationsProps {
  className?: string;
}

export default function DataVisualizations({ className = '' }: DataVisualizationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let time = 0;
    const dataPoints = Array.from({ length: 10 }, () => Math.random());

    function drawChart(ctx: CanvasRenderingContext2D, time: number) {
      const width = canvas!.width;
      const height = canvas!.height;

      // Update data points with smooth transitions
      dataPoints.forEach((point, i) => {
        dataPoints[i] = point + (Math.random() - 0.5) * 0.1;
        dataPoints[i] = Math.max(0, Math.min(1, dataPoints[i]));
      });

      // Draw glowing lines
      ctx.beginPath();
      ctx.moveTo(0, height * (1 - dataPoints[0]));
      for (let i = 1; i < dataPoints.length; i++) {
        const x = (width * i) / (dataPoints.length - 1);
        const y = height * (1 - dataPoints[i]);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(89, 203, 232, ${0.8 + Math.sin(time) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw glowing points
      dataPoints.forEach((point, i) => {
        const x = (width * i) / (dataPoints.length - 1);
        const y = height * (1 - point);

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
        gradient.addColorStop(0, 'rgba(89, 203, 232, 0.8)');
        gradient.addColorStop(1, 'rgba(89, 203, 232, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Center point
        ctx.fillStyle = '#59CBE8';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawChart(ctx, time);
      time += 0.02;
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Market Activity Chart */}
      <HolographicCard className="w-64 h-40">
        <div className="p-4">
          <h3 className="text-sm font-mono text-[rgba(89,203,232,0.9)] mb-2">Market Activity</h3>
          <canvas
            ref={canvasRef}
            className="w-full h-24"
          />
        </div>
      </HolographicCard>

      {/* Portfolio Metrics */}
      <HolographicCard className="w-48 mt-4">
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[rgba(89,203,232,0.9)]">
              $45.2K
              <span className="ml-2 text-sm text-green-400">↑</span>
            </div>
            <div className="text-sm text-[rgba(89,203,232,0.6)]">Portfolio Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[rgba(89,203,232,0.9)]">
              85%
              <span className="ml-2 text-sm text-blue-400">→</span>
            </div>
            <div className="text-sm text-[rgba(89,203,232,0.6)]">Success Rate</div>
          </div>
        </div>
      </HolographicCard>

      {/* Data Flow Lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-[rgba(89,203,232,0.2)] via-[rgba(89,203,232,0.1)] to-transparent animate-stream" />
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-[rgba(89,203,232,0.2)] via-[rgba(89,203,232,0.1)] to-transparent animate-stream" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}