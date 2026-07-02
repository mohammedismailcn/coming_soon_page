import { useEffect, useMemo, useState } from "react";
import { BREAKPOINTS, NODE_COUNT } from "./constants";
import type { BreakpointKey, NetworkConnectionData, NetworkGraph, NetworkNodeData, PropertyIconType } from "./types";

const DESKTOP_POINTS = [
  [65, 35], // 0: centerpiece house
  [46, 20], // 1: office
  [60, 10], // 2: handshake
  [78, 12], // 3: location pin
  [91, 24], // 4: commercial building
  [49, 38], // 5: key
  [82, 37], // 6: land
  [43, 65], // 7: location pin (land base)
  [63, 71], // 8: apartment
  [85, 61], // 9: rental
  [26, 76], // 10: house
  [38, 88], // 11: handshake
  [51, 86], // 12: villa
  [75, 85], // 13: sold
  [38, 8],  // 14: investment
  [69, 23], // 15: villa (secondary)
  [88, 14], // 16: house (secondary)
  [93, 48], // 17: land (secondary)
  [56, 54], // 18: key (secondary)
  [72, 54], // 19: location (secondary)
  [78, 70], // 20: plot
  [33, 56], // 21: house (tertiary)
  [48, 76], // 22: office (secondary)
  [61, 89], // 23: handshake (secondary)
  [83, 78], // 24: office (tertiary)
] as const;

const NODE_DEFS: { icon: PropertyIconType; size: number }[] = [
  { icon: "origin", size: 104 },
  { icon: "office", size: 56 },
  { icon: "handshake", size: 52 },
  { icon: "location", size: 56 },
  { icon: "commercial", size: 60 },
  { icon: "key", size: 48 },
  { icon: "land", size: 52 },
  { icon: "location", size: 56 },
  { icon: "apartment", size: 56 },
  { icon: "rental", size: 54 },
  { icon: "house", size: 52 },
  { icon: "handshake", size: 50 },
  { icon: "villa", size: 54 },
  { icon: "sold", size: 52 },
  { icon: "investment", size: 50 },
  { icon: "villa", size: 48 },
  { icon: "house", size: 46 },
  { icon: "land", size: 46 },
  { icon: "key", size: 44 },
  { icon: "location", size: 46 },
  { icon: "plot", size: 48 },
  { icon: "house", size: 46 },
  { icon: "office", size: 48 },
  { icon: "handshake", size: 44 },
  { icon: "office", size: 46 },
];

const EXTRA_EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 6], [0, 7], [0, 8], [0, 9],
  [1, 14], [1, 2], [2, 3], [3, 4], [5, 1], [5, 7],
  [7, 10], [7, 11], [7, 12], [8, 12], [8, 13], [6, 9],
  [9, 13], [13, 12], [10, 11], [11, 12],
  [15, 0], [15, 3], [16, 3], [16, 4], [17, 6], [17, 4],
  [18, 5], [18, 0], [19, 0], [19, 8], [20, 0], [20, 6],
  [21, 5], [21, 7], [22, 7], [22, 11], [23, 12], [23, 11],
  [24, 13], [24, 9],
] as const;

function getBreakpoint(width: number): BreakpointKey {
  if (width < BREAKPOINTS.tablet) return "mobile";
  if (width < BREAKPOINTS.desktop) return "tablet";
  return "desktop";
}

function useViewportBreakpoint(): BreakpointKey {
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>(() =>
    typeof window === "undefined" ? "desktop" : getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => setBreakpoint(getBreakpoint(window.innerWidth)));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return breakpoint;
}

function sourceIndicesForBreakpoint(breakpoint: BreakpointKey): number[] {
  const count = NODE_COUNT[breakpoint];
  return Array.from({ length: count }, (_, index) => index);
}

function scalePoint(x: number, y: number, breakpoint: BreakpointKey): [number, number] {
  // The original points are clustered on the right (center ~60%).
  // We re-center them to 50% and stretch them so they cover the full width.
  const fullWidthX = 50 + (x - 60) * 1.4;

  if (breakpoint === "mobile") {
    return [Math.min(92, Math.max(8, 50 + (fullWidthX - 50) * 1.1)), Math.min(92, Math.max(8, 50 + (y - 50) * 1.05))];
  }
  if (breakpoint === "tablet") {
    return [Math.min(94, Math.max(6, 50 + (fullWidthX - 50) * 1.0)), Math.min(92, Math.max(7, 50 + (y - 50) * 0.94))];
  }
  
  // Desktop (full width)
  return [Math.min(96, Math.max(4, fullWidthX)), y];
}

function buildNodes(breakpoint: BreakpointKey): NetworkNodeData[] {
  const indices = sourceIndicesForBreakpoint(breakpoint);
  return indices.map((sourceIndex, index) => {
    const [sourceX, sourceY] = DESKTOP_POINTS[sourceIndex];
    const [x, y] = scalePoint(sourceX, sourceY, breakpoint);
    const def = NODE_DEFS[sourceIndex] || { icon: "house", size: 48 };
    const isOrigin = def.icon === "origin";

    // Adjust sizes for smaller screens
    let finalSize = def.size;
    if (breakpoint === "mobile") {
      finalSize = isOrigin ? 82 : Math.max(44, Math.round(def.size * 0.85));
    } else if (breakpoint === "tablet") {
      finalSize = isOrigin ? 86 : Math.max(38, Math.round(def.size * 0.82));
    }

    return {
      id: `node-${sourceIndex}`,
      x,
      y,
      icon: def.icon,
      size: finalSize,
      floatDelay: (sourceIndex % 6) * 0.32,
      floatDuration: 5.2 + (sourceIndex % 4) * 0.75,
      depth: index,
    };
  });
}

function addEdge(edges: Map<string, NetworkConnectionData>, fromId: string, toId: string, curveSeed: number) {
  if (fromId === toId) return;
  const id = [fromId, toId].sort().join("::");
  if (edges.has(id)) return;
  const curve = (((curveSeed % 5) - 2) * 2.5) + 0.5;
  edges.set(id, { id, fromId, toId, curve });
}

function buildConnections(nodes: NetworkNodeData[]): NetworkConnectionData[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges = new Map<string, NetworkConnectionData>();

  EXTRA_EDGES.forEach(([a, b], index) => {
    const from = nodeMap.get(`node-${a}`);
    const to = nodeMap.get(`node-${b}`);
    if (from && to) {
      addEdge(edges, from.id, to.id, index);
    }
  });

  return [...edges.values()];
}

function buildGraph(breakpoint: BreakpointKey): NetworkGraph {
  const nodes = buildNodes(breakpoint);
  return { nodes, connections: buildConnections(nodes) };
}

export function useNetwork(): NetworkGraph {
  const breakpoint = useViewportBreakpoint();
  return useMemo(() => buildGraph(breakpoint), [breakpoint]);
}