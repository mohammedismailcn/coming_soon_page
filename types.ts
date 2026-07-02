export type PropertyIconType =
  | "origin"
  | "house"
  | "apartment"
  | "villa"
  | "land"
  | "commercial"
  | "plot"
  | "rental"
  | "office"
  | "location"
  | "handshake"
  | "key"
  | "investment"
  | "sold";

export interface NetworkNodeData {
  id: string;
  x: number;
  y: number;
  icon: PropertyIconType;
  size: number;
  floatDelay: number;
  floatDuration: number;
  depth: number;
}

export interface NetworkConnectionData {
  id: string;
  fromId: string;
  toId: string;
  curve: number;
}

export interface NetworkGraph {
  nodes: NetworkNodeData[];
  connections: NetworkConnectionData[];
}

export type BreakpointKey = "mobile" | "tablet" | "desktop";