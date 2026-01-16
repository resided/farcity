// Isometric rendering constants

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const TILE_DEPTH = 16;

// Zoom limits
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.5;

// Vehicle constants
export const CAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b',
  '#1e293b', '#fafafa', '#fcd34d', '#a3e635',
];

export const BUS_COLORS = [
  '#fbbf24', '#f59e0b', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#ef4444',
];

export const CAR_MIN_ZOOM = 0.4;
export const CAR_MIN_ZOOM_MOBILE = 0.6;

export const BUS_MIN_ZOOM = 0.4;
export const BUS_MIN_POPULATION = 100;
export const BUS_SPEED_MIN = 0.25;
export const BUS_SPEED_MAX = 0.35;
export const BUS_SPAWN_INTERVAL_MIN = 8;
export const BUS_SPAWN_INTERVAL_MAX = 15;
export const BUS_STOP_DURATION_MIN = 2;
export const BUS_STOP_DURATION_MAX = 5;
export const MAX_BUSES = 30;
export const MAX_BUSES_MOBILE = 8;

// Pedestrian constants
export const PEDESTRIAN_SKIN_COLORS = [
  '#fdbeb5', '#f5d0c5', '#d4a574', '#c68642', '#8d5524', '#6d4c41',
];

export const PEDESTRIAN_SHIRT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#f43f5e', '#fafafa', '#1e293b', '#64748b',
];

export const PEDESTRIAN_PANTS_COLORS = [
  '#1e293b', '#334155', '#475569', '#3b82f6', '#1e40af',
  '#7c3aed', '#4c1d95', '#6d4c41', '#8d6e63', '#fafafa',
];

export const PEDESTRIAN_HAT_COLORS = [
  '#ef4444', '#f97316', '#1e293b', '#fafafa', '#3b82f6', '#22c55e',
];

export const PEDESTRIAN_MAT_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6',
];

export const PEDESTRIAN_MIN_ZOOM = 0.5;
export const PEDESTRIAN_MIN_ZOOM_MOBILE = 0.7;
export const PEDESTRIAN_MAX_COUNT = 500;
export const PEDESTRIAN_MAX_COUNT_MOBILE = 80;
export const PEDESTRIAN_ROAD_TILE_DENSITY = 0.8;
export const PEDESTRIAN_ROAD_TILE_DENSITY_MOBILE = 0.3;
export const PEDESTRIAN_SPAWN_INTERVAL = 0.3;
export const PEDESTRIAN_SPAWN_INTERVAL_MOBILE = 0.8;
export const PEDESTRIAN_SPAWN_BATCH_SIZE = 5;
export const PEDESTRIAN_SPAWN_BATCH_SIZE_MOBILE = 2;

export const PEDESTRIAN_BUILDING_ENTER_TIME = 1.5;
export const PEDESTRIAN_MIN_ACTIVITY_TIME = 15;
export const PEDESTRIAN_MAX_ACTIVITY_TIME = 45;
export const PEDESTRIAN_BUILDING_MIN_TIME = 10;
export const PEDESTRIAN_BUILDING_MAX_TIME = 30;
export const PEDESTRIAN_SOCIAL_CHANCE = 0.002;
export const PEDESTRIAN_SOCIAL_DURATION = 5;
export const PEDESTRIAN_DOG_CHANCE = 0.15;
export const PEDESTRIAN_BAG_CHANCE = 0.4;
export const PEDESTRIAN_HAT_CHANCE = 0.2;
export const PEDESTRIAN_IDLE_CHANCE = 0.001;
export const PEDESTRIAN_BEACH_MIN_TIME = 20;
export const PEDESTRIAN_BEACH_MAX_TIME = 60;
export const PEDESTRIAN_BEACH_SWIM_CHANCE = 0.4;

// Train constants  
export const TRAIN_MIN_ZOOM = 0.3;
export const MIN_RAIL_TILES_FOR_TRAINS = 20;
export const MAX_TRAINS = 15;
export const MAX_TRAINS_MOBILE = 5;
export const TRAIN_SPAWN_INTERVAL = 10;
export const TRAIN_SPAWN_INTERVAL_MOBILE = 20;
export const TRAINS_PER_RAIL_TILES = 50;
export const TRAINS_PER_RAIL_TILES_MOBILE = 100;

// Traffic light timing
export const TRAFFIC_LIGHT_TIMING = {
  GREEN_DURATION: 3.0,
  YELLOW_DURATION: 0.8,
  TOTAL_CYCLE: 7.6,
};

export const TRAFFIC_LIGHT_MIN_ZOOM = 0.6;
export const DIRECTION_ARROWS_MIN_ZOOM = 0.8;
export const MEDIAN_PLANTS_MIN_ZOOM = 0.7;
export const LANE_MARKINGS_MEDIAN_MIN_ZOOM = 0.5;

// Road colors
export const ROAD_COLORS = {
  ASPHALT: '#4a4a4a',
  ASPHALT_DARK: '#3a3a3a',
  ASPHALT_LIGHT: '#5a5a5a',
  LANE_MARKING: '#ffffff',
  CENTER_LINE: '#fbbf24',
  MEDIAN_CONCRETE: '#9ca3af',
  MEDIAN_PLANTS: '#4a7c3f',
  SIDEWALK: '#9ca3af',
  CURB: '#6b7280',
  TRAFFIC_LIGHT_POLE: '#374151',
  TRAFFIC_LIGHT_RED: '#ef4444',
  TRAFFIC_LIGHT_YELLOW: '#fbbf24',
  TRAFFIC_LIGHT_GREEN: '#22c55e',
  TRAFFIC_LIGHT_OFF: '#1f2937',
};

// Direction metadata for vehicle rendering
export const DIRECTION_META: Record<string, {
  vec: { dx: number; dy: number };
  normal: { nx: number; ny: number };
  step: { x: number; y: number };
  angle: number;
}> = {
  north: {
    vec: { dx: -TILE_WIDTH / 2, dy: -TILE_HEIGHT / 2 },
    normal: { nx: -0.447, ny: 0.894 },
    step: { x: -1, y: 0 },
    angle: Math.PI * 0.75,
  },
  south: {
    vec: { dx: TILE_WIDTH / 2, dy: TILE_HEIGHT / 2 },
    normal: { nx: 0.447, ny: -0.894 },
    step: { x: 1, y: 0 },
    angle: -Math.PI * 0.25,
  },
  east: {
    vec: { dx: TILE_WIDTH / 2, dy: -TILE_HEIGHT / 2 },
    normal: { nx: 0.447, ny: 0.894 },
    step: { x: 0, y: -1 },
    angle: -Math.PI * 0.75,
  },
  west: {
    vec: { dx: -TILE_WIDTH / 2, dy: TILE_HEIGHT / 2 },
    normal: { nx: -0.447, ny: -0.894 },
    step: { x: 0, y: 1 },
    angle: Math.PI * 0.25,
  },
};

// Overlay mode types
export type OverlayMode = 
  | 'none'
  | 'power'
  | 'water'
  | 'fire'
  | 'police'
  | 'health'
  | 'education'
  | 'land_value'
  | 'pollution'
  | 'crime'
  | 'traffic'
  | 'zones';

// Skip small elements zoom threshold
export const SKIP_SMALL_ELEMENTS_ZOOM_THRESHOLD = 0.35;
export const VEHICLE_FAR_ZOOM_THRESHOLD = 0.35;

// Key pan speed
export const KEY_PAN_SPEED = 20;
