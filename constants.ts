import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building,
  Building2,
  Home,
  House,
  KeyRound,
  Landmark,
  LandPlot,
  MapPin,
  Handshake,
  Key,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import type { BreakpointKey, PropertyIconType } from "./types";

export const ICON_MAP: Record<PropertyIconType, LucideIcon> = {
  origin: House,
  house: Home,
  apartment: Building2,
  villa: Landmark,
  land: Building, // Placeholder
  commercial: Building,
  plot: LandPlot,
  rental: KeyRound,
  office: Briefcase,
  location: MapPin,
  handshake: Handshake,
  key: Key,
  investment: TrendingUp,
  sold: CircleDollarSign,
};

export const ICON_ORDER: PropertyIconType[] = [
  "origin",
  "apartment",
  "land",
  "villa",
  "commercial",
  "house",
  "office",
  "rental",
  "plot",
  "location",
  "handshake",
  "key",
  "investment",
  "sold",
];

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1280,
} as const;

export const NODE_COUNT: Record<BreakpointKey, number> = {
  mobile: 5,
  tablet: 12,
  desktop: 25,
};

export const COLORS = {
  bgFrom: "#FFFFFF",
  bgTo: "#E8F2FF",
  glow: "#3B82F6",
  glowSoft: "rgba(59,130,246,0.18)",
  line: "rgba(96,165,250,0.22)",
  lineActive: "#3B82F6",
  nodeBorder: "rgba(255, 255, 255, 0.8)",
  nodeGlass: "rgba(255, 255, 255, 0.45)",
} as const;

export const ENTRANCE_BASE_DELAY_SECONDS = 0.5;
export const ENTRANCE_NODE_STAGGER_SECONDS = 0.12;
export const CONNECTION_DRAW_SECONDS = 0.9;

export const AMBIENT_PULSE_INTERVAL_MS = 2200;
export const AMBIENT_PULSE_TRAVEL_SECONDS = 1.2;

export const CAMERA_CYCLE_SECONDS = 30;
export const PARALLAX_MAX_PX = 15;

export const PARTICLE_COUNT = 20;
export const PARTICLE_SEED = 447199;