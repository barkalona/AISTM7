import React, { useEffect, useRef } from 'react';

interface BlockchainVisualizationProps {
  className?: string;
  nodeColor?: string;
  connectionColor?: string;
  nodeCount?: number;
  animationSpeed?: number;
}

const BlockchainVisualization: React.FC<BlockchainVisualizationProps> = ({
  className = '',
  nodeColor = '#59CBE8',
  connectionColor = '#59CBE8',
  nodeCount = 50,
  animationSpeed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const connections: { a: number; b: number }[] = [];
    const particles: { x: number; y: number; dx: number; dy: number }[] = [];
    const particleSpeed = animationSpeed * 0.2;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generateNodes();
    };

    const generateNodes = () => {
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * animationSpeed,
        vy: (Math.random() - 0.5) * animationSpeed,
      }));

      connections.length = 0;
      nodes.forEach((_, i) => {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.97) {
            connections.push({ a: i, b: j });
          }
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = connectionColor;
      connections.forEach(({ a, b }) => {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();

        // Add particles along connections
        if (Math.random() > 0.98) {
          particles.push({
            x: nodeA.x,
            y: nodeA.y,
            dx: (nodeB.x - nodeA.x) * particleSpeed,
            dy: (nodeB.y - nodeA.y) * particleSpeed,
          });
        }
      });

      // Draw nodes
      ctx.globalAlpha = 1;
      nodes.forEach(({ x, y }) => {
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, `${nodeColor}40`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw particles
      particles.forEach((particle, index) => {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Add particle glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, 4
        );
        gradient.addColorStop(0, `${nodeColor}40`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();

        particle.x += particle.dx;
        particle.y += particle.dy;

        if (
          particle.x < 0 ||
          particle.x > canvas.width ||
          particle.y < 0 ||
          particle.y > canvas.height
        ) {
          particles.splice(index, 1);
        }
      });

      // Update node positions
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [nodeColor, connectionColor, nodeCount, animationSpeed]);

  return <canvas ref={canvasRef} className={className} />;
};

export default BlockchainVisualization;