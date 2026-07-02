"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AMBIENT_PULSE_TRAVEL_SECONDS, COLORS, CONNECTION_DRAW_SECONDS } from "./constants";
import type { NetworkConnectionData, NetworkNodeData } from "./types";

interface NetworkLineProps {
  connection: NetworkConnectionData;
  fromNode: NetworkNodeData;
  toNode: NetworkNodeData;
  isVisible: boolean;
  isPulsing: boolean;
  pulseTick: number;
}

function buildCurve(fromNode: NetworkNodeData, toNode: NetworkNodeData, curve: number) {
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const normalX = -dy / length;
  const normalY = dx / length;
  const controlX = midX + normalX * curve;
  const controlY = midY + normalY * curve;
  return `M ${fromNode.x} ${fromNode.y} Q ${controlX} ${controlY} ${toNode.x} ${toNode.y}`;
}

function NetworkLineBase({ connection, fromNode, toNode, isVisible, isPulsing, pulseTick }: NetworkLineProps) {
  const reduceMotion = useReducedMotion();
  const pathId = `network-path-${connection.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const d = buildCurve(fromNode, toNode, connection.curve);

  return (
    <g className="network-line-group">
      <motion.path
        d={d}
        fill="none"
        stroke="#60A5FA"
        strokeWidth={1.2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="network-line-glow"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 0.95 : 0 }}
        transition={{ duration: CONNECTION_DRAW_SECONDS, ease: "easeInOut" }}
      />
      <motion.path
        id={pathId}
        d={d}
        fill="none"
        stroke={isPulsing ? "#FFFFFF" : `url(#line-gradient-${connection.id.length % 3})`}
        strokeWidth={0.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: CONNECTION_DRAW_SECONDS, ease: "easeInOut" }}
      />
      {isPulsing && isVisible && !reduceMotion && (
        <circle key={pulseTick} r={1.6} fill="#FFFFFF" className="energy-dot">
          <animateMotion dur={`${AMBIENT_PULSE_TRAVEL_SECONDS}s`} repeatCount={1} fill="freeze">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      )}
    </g>
  );
}

export const NetworkLine = memo(NetworkLineBase);