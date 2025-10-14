import React, { useEffect, useRef } from 'react';
import './LightningBackground.css';

const LightningBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Lightning bolt class
    class LightningBolt {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      segments: { x: number; y: number }[];
      life: number;
      maxLife: number;
      color: string;
      width: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = 0; // Start from the top
        this.targetX = Math.random() * canvas.width;
        this.targetY = Math.random() * canvas.height;
        this.segments = [];
        this.life = 0;
        this.maxLife = 20 + Math.random() * 20; // Shorter lifespan
        this.color = Math.random() > 0.5 ? '#E0E7FF' : '#F0F2F5'; // Light blue or light gray
        this.width = 0.5 + Math.random() * 1.5; // Thinner bolts
        
        this.generateSegments();
      }

      generateSegments() {
        const segments = 8 + Math.floor(Math.random() * 12);
        const dx = (this.targetX - this.x) / segments;
        const dy = (this.targetY - this.y) / segments;

        this.segments = [{ x: this.x, y: this.y }];

        for (let i = 1; i < segments; i++) {
          const x = this.x + dx * i + (Math.random() - 0.5) * 30;
          const y = this.y + dy * i + (Math.random() - 0.5) * 30;
          this.segments.push({ x, y });
        }

        this.segments.push({ x: this.targetX, y: this.targetY });
      }

      update() {
        this.life++;
        return this.life < this.maxLife;
      }

      draw() {
        const alpha = Math.max(0, 1 - this.life / this.maxLife);
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5; // Reduced blur

        ctx.beginPath();
        ctx.moveTo(this.segments[0].x, this.segments[0].y);

        for (let i = 1; i < this.segments.length; i++) {
          ctx.lineTo(this.segments[i].x, this.segments[i].y);
        }

        ctx.stroke();
        ctx.restore();
      }
    }

    const lightningBolts: LightningBolt[] = [];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add new lightning bolts randomly
      if (Math.random() < 0.01) { // Decreased frequency
        lightningBolts.push(new LightningBolt());
      }

      // Update and draw lightning bolts
      for (let i = lightningBolts.length - 1; i >= 0; i--) {
        const bolt = lightningBolts[i];
        if (!bolt.update()) {
          lightningBolts.splice(i, 1);
        } else {
          bolt.draw();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="lightning-background"
      aria-hidden="true"
    />
  );
};

export default LightningBackground;