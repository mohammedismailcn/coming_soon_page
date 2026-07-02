import re

with open('NetworkNode.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

imports = """import { COLORS } from "./constants";
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
import investmentImg from "./assets/icon_only_clean/01_growth_chart.png";"""

content = re.sub(
    r'import \{ COLORS \} from "\./constants";\nimport type \{ NetworkNodeData, PropertyIconType \} from "\./types";',
    imports,
    content
)

new_func = """// Custom Premium 3D-shaded SVG Icons replaced with uploaded PNGs
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
}"""

content = re.sub(
    r'// Custom Premium 3D-shaded SVG Icons.*?(?=function NetworkNodeBase)',
    new_func + '\n\n',
    content,
    flags=re.DOTALL
)

with open('NetworkNode.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
