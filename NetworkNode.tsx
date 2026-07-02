"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { COLORS } from "./constants";
import type { NetworkNodeData, PropertyIconType } from "./types";

import originImg from "./assets/icon_only_clean/07_main_house.png";
import apartmentImg from "./assets/icon_only_clean/04_apartment_left.png";
import officeImg from "./assets/icon_only_clean/05_apartment_right.png";
import houseImg from "./assets/icon_only_clean/11_house_left.png";
import villaImg from "./assets/icon_only_clean/13_lower_house.png";
import commercialImg from "./assets/icon_only_clean/14_building_lower.png";
import landImg from "./assets/icon_only_clean/08_tree_land.png";
import plotImg from "./assets/icon_only_clean/10_land_pin.png";
import locationImg from "./assets/icon_only_clean/03_location_pin_top.png";
import rentalImg from "./assets/icon_only_clean/09_for_rent.png";
import soldImg from "./assets/icon_only_clean/15_sold_house.png";
import handshakeImg from "./assets/icon_only_clean/12_handshake.png";
import keyImg from "./assets/icon_only_clean/06_key.png";
import investmentImg from "./assets/icon_only_clean/01_growth_chart.png";

interface NetworkNodeProps {
  node: NetworkNodeData;
  isVisible: boolean;
  isPulsing: boolean;
}

// Custom Premium 3D-shaded SVG Icons replaced with uploaded PNGs
function PropertyNetworkIcon({ icon, size }: { icon: PropertyIconType; size: number }) {
  const getIconSrc = (type: PropertyIconType) => {
    switch (type) {
      case "origin": return originImg;
      case "apartment": return apartmentImg;
      case "office": return officeImg;
      case "house": return houseImg;
      case "villa": return villaImg;
      case "commercial": return commercialImg;
      case "land": return landImg;
      case "plot": return plotImg;
      case "location": return locationImg;
      case "rental": return rentalImg;
      case "sold": return soldImg;
      case "handshake": return handshakeImg;
      case "key": return keyImg;
      case "investment": return investmentImg;
      default: return houseImg;
    }
  };

  return (
    <img 
      src={getIconSrc(icon)} 
      alt={icon} 
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "contain", 
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" 
      }} 
      className="png-3d-node" 
      draggable={false}
    />
  );
}

function NetworkNodeBase({ node, isVisible, isPulsing }: NetworkNodeProps) {
  const reduceMotion = useReducedMotion();
  const isOrigin = node.icon === "origin";

  return (
    <motion.div
      className={`network-node ${isOrigin ? "network-node--origin" : ""}`}
      style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.size, height: node.size, x: "-50%", y: "-50%", willChange: "transform" }}
      initial={{ opacity: 0, scale: isOrigin ? 0.08 : 0.34 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? (isPulsing ? [1, 1.08, 1] : 1) : 0.34,
      }}
      transition={isPulsing ? { duration: 0.8, ease: "easeInOut" } : { duration: isOrigin ? 1.0 : 0.58, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="network-node-shell"
        style={{
          background: COLORS.nodeGlass,
          borderColor: COLORS.nodeBorder,
          boxShadow: isPulsing
            ? `0 12px 50px rgba(96, 165, 250, 0.9), inset 0 0 30px rgba(255,255,255,1), 0 0 4px 4px rgba(255,255,255,0.8)`
            : `0 8px 28px rgba(96,165,250,0.12), inset 0 0 14px rgba(255,255,255,0.48), 0 0 1px 1px rgba(96,165,250,0.16)`,
          transition: "box-shadow 0.6s ease-out",
        }}
      >
        <span className="node-inner-glow" aria-hidden="true" />
        <span className="node-bubble-highlight" aria-hidden="true" />
        <div className="node-icon-wrapper" style={{ width: "95%", height: "95%" }}>
          <PropertyNetworkIcon icon={node.icon} size={node.size} />
        </div>
      </div>
    </motion.div>
  );
}

export const NetworkNode = memo(NetworkNodeBase);
