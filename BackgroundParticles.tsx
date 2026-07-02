"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PARTICLE_COUNT, PARTICLE_SEED } from "./constants";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateParticles(): Particle[] {
  const random = createSeededRandom(PARTICLE_SEED);
  return Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
    id,
    x: random() * 100,
    y: random() * 100,
    size: 1 + random() * 2,
    duration: 12 + random() * 10,
    delay: random() * 8,
    driftX: (random() - 0.5) * 40,
    driftY: (random() - 0.5) * 40,
  }));
}

export function BackgroundParticles() {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(generateParticles, []);

  return (
    <div className="background-particles">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="background-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            willChange: "transform, opacity",
          }}
          initial={{ opacity: 0.15 }}
          animate={
            reduceMotion
              ? { opacity: 0.2 }
              : {
                  x: [0, particle.driftX, 0],
                  y: [0, particle.driftY, 0],
                  opacity: [0.15, 0.35, 0.15],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
