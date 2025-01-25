"use client";

import { useEffect, useRef } from 'react';

interface HexagonGridProps {
  className?: string;
}

interface Hexagon {
  x: number;
  y: number;
  connections: { x: number; y: number; active: boolean }[];
  pulseOffset: number;
}

// Constants
const HEXAGON_SIZE = 40;
const HEXAGON_HEIGHT = HEXAGON_SIZE * Math.sqrt(3);

export default function HexagonGrid({ className = '' }: HexagonGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hexagonsRef = useRef<Hexagon[]>([]);
  const particlesRef = useRef<{ x: number; y: number; progress: number; path: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size to match display size
    const setCanvasSize = () => {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      initHexagons();
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    function initHexagons() {
      if (!canvas) return;
      const cols = Math.ceil(canvas.width / (HEXAGON_SIZE * 1.5)) + 1;
      const rows = Math.ceil(canvas.height / HEXAGON_HEIGHT) + 1;
      const hexagons: Hexagon[] = [];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = j * HEXAGON_SIZE * 1.5;
          const y = i * HEXAGON_HEIGHT + (j % 2) * HEXAGON_HEIGHT / 2;
          
          // Create connections to nearby hexagons
          const connections: { x: number; y: number; active: boolean }[] = [];
          if (Math.random() < 0.4) {
            if (j < cols - 1) connections.push({ x: x + HEXAGON_SIZE * 1.5, y, active: false });
            if (i < rows - 1) connections.push({ x, y: y + HEXAGON_HEIGHT, active: false });
          }
          
          hexagons.push({ x, y, connections, pulseOffset: Math.random() * Math.PI * 2 });
        }
      }

      hexagonsRef.current = hexagons;
      particlesRef.current = [];
    }

    function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, pulseOffset: number) {
      const vertices = 6;
      const angleOffset = Math.PI / 6;
      
      // Calculate glow intensity based on time and position
      const glowIntensity = (Math.sin(time + pulseOffset) * 0.3 + 0.7) * 0.8;
      
      // Draw hexagon
      ctx.beginPath();
      for (let i = 0; i <= vertices; i++) {
        const angle = (i * 2 * Math.PI / vertices) + angleOffset;
        const px = x + HEXAGON_SIZE * Math.cos(angle);
        const py = y + HEXAGON_SIZE * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();

      // Create gradient for glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, HEXAGON_SIZE);
      gradient.addColorStop(0, `rgba(89, 203, 232, ${0.1 * glowIntensity})`);
      gradient.addColorStop(0.5, `rgba(89, 203, 232, ${0.05 * glowIntensity})`);
      gradient.addColorStop(1, 'rgba(89, 203, 232, 0)');

      // Apply gradient fill
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw hexagon border with glow
      ctx.strokeStyle = `rgba(89, 203, 232, ${0.3 * glowIntensity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      return glowIntensity;
    }

    function drawConnection(
      ctx: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      glowIntensity: number
    ) {
      // Connection line with gradient
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, `rgba(89, 203, 232, ${0.2 * glowIntensity})`);
      gradient.addColorStop(0.5, `rgba(89, 203, 232, ${0.3 * glowIntensity})`);
      gradient.addColorStop(1, `rgba(89, 203, 232, ${0.2 * glowIntensity})`);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function updateParticles(time: number) {
      // Add new particles
      if (Math.random() < 0.1 && hexagonsRef.current.length > 0) {
        const sourceHexagon = hexagonsRef.current[Math.floor(Math.random() * hexagonsRef.current.length)];
        if (sourceHexagon.connections.length > 0) {
          const pathIndex = Math.floor(Math.random() * sourceHexagon.connections.length);
          particlesRef.current.push({
            x: sourceHexagon.x,
            y: sourceHexagon.y,
            progress: 0,
            path: pathIndex
          });
        }
      }

      // Update particle positions
      particlesRef.current = particlesRef.current.filter(particle => {
        const hexagon = hexagonsRef.current.find(h => h.x === particle.x && h.y === particle.y);
        if (!hexagon || !hexagon.connections[particle.path]) return false;

        particle.progress += 0.02;
        if (particle.progress >= 1) return false;

        return true;
      });
    }

    function drawParticles(ctx: CanvasRenderingContext2D, time: number) {
      particlesRef.current.forEach(particle => {
        const hexagon = hexagonsRef.current.find(h => h.x === particle.x && h.y === particle.y);
        if (!hexagon || !hexagon.connections[particle.path]) return;

        const connection = hexagon.connections[particle.path];
        const x = hexagon.x + (connection.x - hexagon.x) * particle.progress;
        const y = hexagon.y + (connection.y - hexagon.y) * particle.progress;

        // Draw glowing particle
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
        gradient.addColorStop(0, 'rgba(89, 203, 232, 0.8)');
        gradient.addColorStop(1, 'rgba(89, 203, 232, 0)');

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });
    }

    let time = 0;
    function animate() {
      if (!canvas || !context) return;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw hexagons and connections
      hexagonsRef.current.forEach(hexagon => {
        const glowIntensity = drawHexagon(context, hexagon.x, hexagon.y, time, hexagon.pulseOffset);
        
        // Draw connections
        hexagon.connections.forEach(connection => {
          drawConnection(
            context,
            hexagon.x,
            hexagon.y,
            connection.x,
            connection.y,
            glowIntensity
          );
        });
      });

      // Update and draw particles
      updateParticles(time);
      drawParticles(context, time);

      time += 0.01;
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity: 0.3 }}
    />
  );
}