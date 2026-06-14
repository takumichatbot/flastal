'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const PARTICLE_COUNT = 12;

export default function FloatingParticles({ count = PARTICLE_COUNT, color = 'bg-pink-300' }) {
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 1000 });

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        xRatio: Math.random(),
        yRatio: Math.random(),
        dy: -(Math.random() * 200 + 50),
        dx: (Math.random() - 0.5) * 100,
        duration: Math.random() * 10 + 10,
      })),
    [count]
  );

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute w-3 h-3 ${color} rounded-full mix-blend-multiply filter blur-[1px] opacity-40`}
          initial={{ x: p.xRatio * windowSize.width, y: p.yRatio * windowSize.height }}
          animate={{
            y: [null, p.dy],
            x: [null, p.dx],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}
