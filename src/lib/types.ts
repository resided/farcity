// Core game types for FarCity - Enhanced with simulation features

export type BuildingCategory = 
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'infrastructure' 
  | 'entertainment'
  | 'services'
  | 'premium';

export type ZoneType = 'none' | 'residential' | 'commercial' | 'industrial';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Building {
  id: string;
  name: string;
  description: string;
  category: BuildingCategory;
  rarity: Rarity;
  price: number;
  premiumPrice?: number;
  size: { width: number; height: number };
  income: number;
  socialBoost: number;
  unlockLevel: number;
  sprite: string;
  color: string;
  accentColor: string;
  animation?: 'pulse' | 'glow' | 'float' | 'sparkle';
  // Simulation properties
  population?: number;
  jobs?: number;
  powerConsumption?: number;
  waterConsumption?: number;
}

export type TileType = 
  | 'empty' 
  | 'grass' 
  | 'water' 
  | 'road' 
  | 'rail'
  | 'bridge'
  | 'building'
  | 'park'
  | 'tree';

export interface TileBuilding {
  type: TileType;
  buildingId?: string;
  level: number;
  population: number;
  jobs: number;
  constructionProgress: number;
  onFire: boolean;
  abandoned: boolean;
}

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  zone: ZoneType;
  building: TileBuilding;
  hasSubway: boolean;
  landValue: number;
  pollution: number;
  crime: number;
}

export interface PlacedBuilding {
  id: string;
  buildingId: string;
  x: number;
  y: number;
  level: number;
  lastCollected: number;
  boosted: boolean;
}

// Vehicle types
export type CarDirection = 'north' | 'south' | 'east' | 'west';

export interface Vehicle {
  id: number;
  tileX: number;
  tileY: number;
  direction: CarDirection;
  progress: number;
  speed: number;
  age: number;
  maxAge: number;
  color: string;
  laneOffset: number;
}

export interface Car extends Vehicle {}

export interface Bus extends Vehicle {
  path: { x: number; y: number }[];
  pathIndex: number;
  stopTimer: number;
  stops: { x: number; y: number }[];
}

export type EmergencyVehicleType = 'fire_truck' | 'police_car' | 'ambulance';

export interface EmergencyVehicle extends Vehicle {
  type: EmergencyVehicleType;
  state: 'dispatching' | 'responding' | 'returning';
  stationX: number;
  stationY: number;
  targetX: number;
  targetY: number;
  path: { x: number; y: number }[];
  pathIndex: number;
  respondTime: number;
  flashTimer: number;
}

// Pedestrian types
export type PedestrianState = 
  | 'walking'
  | 'entering_building'
  | 'inside_building'
  | 'exiting_building'
  | 'at_recreation'
  | 'at_beach'
  | 'idle'
  | 'socializing';

export type PedestrianActivity =
  | 'none'
  | 'shopping'
  | 'working'
  | 'studying'
  | 'playing_basketball'
  | 'playing_tennis'
  | 'playing_soccer'
  | 'playing_baseball'
  | 'swimming'
  | 'skateboarding'
  | 'playground'
  | 'sitting_bench'
  | 'picnicking'
  | 'walking_dog'
  | 'jogging'
  | 'watching_game'
  | 'beach_swimming'
  | 'lying_on_mat';

export type PedestrianDestType = 
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'park'
  | 'beach'
  | 'home';

export interface Pedestrian {
  id: number;
  tileX: number;
  tileY: number;
  direction: CarDirection;
  progress: number;
  speed: number;
  age: number;
  maxAge: number;
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hasHat: boolean;
  hatColor: string;
  walkOffset: number;
  sidewalkSide: 'left' | 'right';
  destType: PedestrianDestType;
  homeX: number;
  homeY: number;
  destX: number;
  destY: number;
  returningHome: boolean;
  path: { x: number; y: number }[];
  pathIndex: number;
  state: PedestrianState;
  activity: PedestrianActivity;
  activityProgress: number;
  activityDuration: number;
  buildingEntryProgress: number;
  socialTarget: number | null;
  activityOffsetX: number;
  activityOffsetY: number;
  activityAnimTimer: number;
  hasBall: boolean;
  hasDog: boolean;
  hasBag: boolean;
  hasBeachMat: boolean;
  matColor: string;
  beachTileX: number;
  beachTileY: number;
  beachEdge: 'north' | 'east' | 'south' | 'west' | null;
}

// Train types
export interface Train {
  id: number;
  tileX: number;
  tileY: number;
  direction: CarDirection;
  progress: number;
  speed: number;
  path: { x: number; y: number }[];
  pathIndex: number;
  carriages: { tileX: number; tileY: number; progress: number }[];
  color: string;
}

// Aircraft types
export interface Airplane {
  id: number;
  x: number;
  y: number;
  altitude: number;
  targetAltitude: number;
  angle: number;
  speed: number;
  state: 'flying' | 'landing' | 'taking_off' | 'taxiing';
  color: string;
}

export interface Helicopter {
  id: number;
  x: number;
  y: number;
  altitude: number;
  targetX: number;
  targetY: number;
  angle: number;
  rotorAngle: number;
  state: 'hovering' | 'flying' | 'landing';
}

// Economy types
export interface Stats {
  population: number;
  jobs: number;
  money: number;
  income: number;
  expenses: number;
  happiness: number;
  health: number;
  education: number;
  safety: number;
  environment: number;
  demand: {
    residential: number;
    commercial: number;
    industrial: number;
  };
}

export interface BudgetCategory {
  name: string;
  funding: number;
  cost: number;
}

export interface Budget {
  police: BudgetCategory;
  fire: BudgetCategory;
  health: BudgetCategory;
  education: BudgetCategory;
  transportation: BudgetCategory;
  parks: BudgetCategory;
  power: BudgetCategory;
  water: BudgetCategory;
}

// Game State
export interface GameState {
  // City info
  id: string;
  cityName: string;
  
  // Currency
  cast: number;
  premium: number;
  
  // Progress
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Grid
  grid: Tile[][];
  gridSize: number;
  
  // Legacy buildings (for backward compat)
  buildings: PlacedBuilding[];
  selectedBuilding: string | null;
  
  // Tools & UI
  selectedTool: Tool;
  activePanel: 'none' | 'budget' | 'statistics' | 'advisors' | 'settings';
  
  // Simulation
  speed: 0 | 1 | 2 | 3;
  year: number;
  month: number;
  day: number;
  hour: number;
  
  // Economy
  stats: Stats;
  budget: Budget;
  taxRate: number;
  effectiveTaxRate: number;
  
  // Services coverage
  services: {
    power: boolean[][];
    water: boolean[][];
    fire: number[][];
    police: number[][];
    health: number[][];
    education: number[][];
  };
  
  // Boosts
  activeBoosts: Boost[];
  
  // UI State
  showShop: boolean;
  showInventory: boolean;
  shopTab: 'buildings' | 'currency' | 'boosts' | 'premium';
  buildingCategory: string;
  
  // Stats tracking
  totalEarned: number;
  totalSpent: number;
  buildingsPlaced: number;
  
  // Time
  lastSaved: number;
  lastCollected: number;
  
  // Disasters
  disastersEnabled: boolean;
  
  // History for statistics
  history: HistoryPoint[];
  
  // Notifications
  notifications: Notification[];
  
  // Game version for entity clearing
  gameVersion: number;
}

export interface HistoryPoint {
  year: number;
  month: number;
  population: number;
  money: number;
  happiness: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  icon: string;
  timestamp: number;
}

export type Tool = 
  | 'select'
  | 'bulldoze'
  | 'road'
  | 'rail'
  | 'zone_residential'
  | 'zone_commercial'
  | 'zone_industrial'
  | 'zone_dezone'
  | 'park'
  | 'tree'
  | 'police_station'
  | 'fire_station'
  | 'hospital'
  | 'school'
  | 'power_plant'
  | 'water_tower';

export interface ToolInfo {
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: 'selection' | 'roads' | 'zones' | 'services' | 'utilities';
}

export const TOOL_INFO: Record<Tool, ToolInfo> = {
  select: { name: 'SELECT', description: 'View tile info', cost: 0, icon: 'grid', category: 'selection' },
  bulldoze: { name: 'BULLDOZE', description: 'Remove structures', cost: 10, icon: 'x', category: 'selection' },
  road: { name: 'ROAD', description: 'Build roads', cost: 10, icon: 'minus', category: 'roads' },
  rail: { name: 'RAIL', description: 'Build rail tracks', cost: 20, icon: 'track', category: 'roads' },
  zone_residential: { name: 'RESIDENTIAL', description: 'Zone for housing', cost: 5, icon: 'res', category: 'zones' },
  zone_commercial: { name: 'COMMERCIAL', description: 'Zone for shops', cost: 5, icon: 'com', category: 'zones' },
  zone_industrial: { name: 'INDUSTRIAL', description: 'Zone for factories', cost: 5, icon: 'ind', category: 'zones' },
  zone_dezone: { name: 'DE-ZONE', description: 'Remove zoning', cost: 0, icon: 'dezone', category: 'zones' },
  park: { name: 'PARK', description: 'Build a park', cost: 100, icon: 'park', category: 'services' },
  tree: { name: 'TREE', description: 'Plant a tree', cost: 5, icon: 'tree', category: 'services' },
  police_station: { name: 'POLICE', description: 'Reduce crime', cost: 500, icon: 'police', category: 'services' },
  fire_station: { name: 'FIRE DEPT', description: 'Fire protection', cost: 500, icon: 'fire', category: 'services' },
  hospital: { name: 'HOSPITAL', description: 'Healthcare', cost: 1000, icon: 'health', category: 'services' },
  school: { name: 'SCHOOL', description: 'Education', cost: 500, icon: 'edu', category: 'services' },
  power_plant: { name: 'POWER', description: 'Generate power', cost: 2000, icon: 'power', category: 'utilities' },
  water_tower: { name: 'WATER', description: 'Water supply', cost: 500, icon: 'water', category: 'utilities' },
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  unlocked: boolean;
}

export interface DailyReward {
  day: number;
  reward: number;
  claimed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  castAmount: number;
  usdPrice: number;
  bonus?: number;
  popular?: boolean;
}

export interface Boost {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  duration: number;
  price: number;
  active: boolean;
  expiresAt?: number;
}

// Saved city metadata
export interface SavedCityMeta {
  id: string;
  cityName: string;
  population: number;
  money: number;
  year: number;
  month: number;
  gridSize: number;
  savedAt: number;
}

// Render state for canvas
export interface WorldRenderState {
  grid: Tile[][];
  gridSize: number;
  offset: { x: number; y: number };
  zoom: number;
  speed: 0 | 1 | 2 | 3;
  canvasSize: { width: number; height: number };
}
