"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { BackgroundParticles } from "./BackgroundParticles";
import { NetworkLine } from "./NetworkLine";
import { NetworkNode } from "./NetworkNode";
import {
  AMBIENT_PULSE_INTERVAL_MS,
  AMBIENT_PULSE_TRAVEL_SECONDS,
  CAMERA_CYCLE_SECONDS,
  COLORS,
  ENTRANCE_BASE_DELAY_SECONDS,
  ENTRANCE_NODE_STAGGER_SECONDS,
  PARALLAX_MAX_PX,
} from "./constants";
import { useNetwork } from "./useNetwork";
import type { NetworkNodeData } from "./types";

interface HeroNetworkProps {
  onReady?: () => void;
}

export function HeroNetwork({ onReady }: HeroNetworkProps) {
  const reduceMotion = useReducedMotion();
  const { nodes, connections } = useNetwork();
  const containerRef = useRef<HTMLDivElement>(null);
  const readyCalledRef = useRef(false);

  const [visibleCount, setVisibleCount] = useState(reduceMotion ? nodes.length : 0);
  const [pulsingNodeId, setPulsingNodeId] = useState<string | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20, mass: 0.4 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20, mass: 0.4 });

  const nodeById = useMemo(() => {
    const map = new Map<string, NetworkNodeData>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const nodeOrder = useMemo(() => {
    const order = new Map<string, number>();
    nodes.forEach((node, index) => order.set(node.id, index));
    return order;
  }, [nodes]);

  useEffect(() => {
    readyCalledRef.current = false;
    setVisibleCount(reduceMotion ? nodes.length : 0);
  }, [nodes, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || nodes.length === 0) return;

    let cancelled = false;
    let index = 0;
    const timers: number[] = [];

    const revealNext = () => {
      if (cancelled) return;
      index += 1;
      setVisibleCount(index);
      if (index < nodes.length) {
        timers.push(window.setTimeout(revealNext, ENTRANCE_NODE_STAGGER_SECONDS * 1000));
      }
    };

    timers.push(window.setTimeout(revealNext, ENTRANCE_BASE_DELAY_SECONDS * 1000));

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [nodes, reduceMotion]);

  useEffect(() => {
    if (nodes.length === 0 || visibleCount < nodes.length || readyCalledRef.current) return;
    readyCalledRef.current = true;
    const timer = window.setTimeout(() => onReady?.(), reduceMotion ? 0 : 500);
    return () => window.clearTimeout(timer);
  }, [nodes.length, onReady, reduceMotion, visibleCount]);

  useEffect(() => {
    if (reduceMotion) return;
    if (nodes.length === 0 || visibleCount < nodes.length) return;

    const interval = window.setInterval(() => {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      setPulsingNodeId(randomNode.id);
      setPulseTick((tick) => tick + 1);
      window.setTimeout(() => setPulsingNodeId(null), AMBIENT_PULSE_TRAVEL_SECONDS * 1000);
    }, AMBIENT_PULSE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [nodes, visibleCount, reduceMotion]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(relativeX * PARALLAX_MAX_PX * 2);
    mouseY.set(relativeY * PARALLAX_MAX_PX * 2);
  }, [mouseX, mouseY, reduceMotion]);

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className="hero-network"
      style={{ background: `radial-gradient(ellipse at center, ${COLORS.bgTo} 0%, ${COLORS.bgFrom} 72%)` }}
    >
      <div className="network-center-glow" style={{ background: `radial-gradient(circle at 52% 24%, ${COLORS.glowSoft} 0%, transparent 46%)` }} />
      <div className="city-horizon" aria-hidden="true" />
      <BackgroundParticles />

      <div
        className="network-motion"
        style={{ willChange: "transform" }}
      >
        <svg className="network-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            {[0, 1, 2].map((index) => (
              <linearGradient id={`line-gradient-${index}`} key={index} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="rgba(96,165,250,0.08)" />
                <stop offset="48%" stopColor="rgba(147,197,253,0.72)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.18)" />
              </linearGradient>
            ))}
            <linearGradient id="wave-grad-1" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(59,130,246,0.04)" />
              <stop offset="35%" stopColor="rgba(96,165,250,0.36)" />
              <stop offset="65%" stopColor="rgba(147,197,253,0.48)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0.08)" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(147,197,253,0.08)" />
              <stop offset="50%" stopColor="rgba(59,130,246,0.32)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.04)" />
            </linearGradient>
          </defs>

          {/* Bottom wave flow */}
          <path id="wave-path-1" d="M -5 86 Q 22 76 52 86 T 105 82" fill="none" stroke="url(#wave-grad-1)" strokeWidth="0.32" />
          <path id="wave-path-2" d="M -5 89 Q 28 80 58 91 T 105 85" fill="none" stroke="url(#wave-grad-2)" strokeWidth="0.18" />
          <path d="M -5 83 Q 18 73 45 84 T 105 78" fill="none" stroke="url(#wave-grad-1)" strokeWidth="0.22" opacity="0.6" />

          {/* Wave animated particles removed for performance */}

          {connections.map((connection) => {
            const fromNode = nodeById.get(connection.fromId);
            const toNode = nodeById.get(connection.toId);
            if (!fromNode || !toNode) return null;
            const fromIndex = nodeOrder.get(connection.fromId) ?? 0;
            const toIndex = nodeOrder.get(connection.toId) ?? 0;
            const isVisible = fromIndex < visibleCount && toIndex < visibleCount;
            const isPulsing = pulsingNodeId === connection.fromId || pulsingNodeId === connection.toId;
            return <NetworkLine key={connection.id} connection={connection} fromNode={fromNode} toNode={toNode} isVisible={isVisible} isPulsing={isPulsing} pulseTick={pulseTick} />;
          })}
        </svg>

        {nodes.map((node, index) => (
          <NetworkNode key={node.id} node={node} isVisible={index < visibleCount} isPulsing={pulsingNodeId === node.id} />
        ))}
      </div>
    </div>
  );
}
