import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

export default function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([
    { x: 0.2, y: 0.3 },  // North America
    { x: 0.4, y: 0.4 },  // South America
    { x: 0.5, y: 0.3 },  // Europe
    { x: 0.6, y: 0.4 },  // Africa
    { x: 0.7, y: 0.3 },  // Asia
    { x: 0.8, y: 0.6 },  // Australia
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Animation loop
    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw points with simple pulse effect
      const points = pointsRef.current;
      const time = Date.now() / 1000;
      
      points.forEach((point, index) => {
        const phase = (time + index) % Math.PI;
        const scale = 1 + Math.sin(phase) * 0.3;
        
        // Draw point
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.offsetWidth,
          point.y * canvas.offsetHeight,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Draw pulse
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
          point.x * canvas.offsetWidth,
          point.y * canvas.offsetHeight,
          8 * scale,
          0,
          Math.PI * 2
        );
        ctx.stroke();

        // Draw connection to next point
        if (index < points.length - 1) {
          const nextPoint = points[index + 1];
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.beginPath();
          ctx.moveTo(
            point.x * canvas.offsetWidth,
            point.y * canvas.offsetHeight
          );
          ctx.lineTo(
            nextPoint.x * canvas.offsetWidth,
            nextPoint.y * canvas.offsetHeight
          );
          ctx.stroke();
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-900/50 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent pointer-events-none" />
    </div>
  );
}