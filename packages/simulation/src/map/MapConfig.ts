export interface MapConfig {
  width: number;   // in meters
  height: number;  // in meters
}

export const DEFAULT_MAP_CONFIG: MapConfig = {
  width: 150000,   // 150 km (renders as 3000px)
  height: 150000,  // 150 km (renders as 3000px)
};
