// ============================================================================
// SPRITE CONFIGURATION
// ============================================================================
// Defines sprite sheets, layouts, and positioning for building rendering

import { TILE_WIDTH, TILE_HEIGHT } from './constants';

// ============================================================================
// SPRITE PACK INTERFACE
// ============================================================================
export interface SpritePack {
  id: string;
  name: string;
  src: string;
  cols: number;
  rows: number;
  layout: 'row' | 'column';
  spriteOrder: readonly string[];
  verticalOffsets: Record<string, number>;
  horizontalOffsets: Record<string, number>;
  buildingToSprite: Record<string, string>;
  globalScale?: number;
}

// ============================================================================
// DEFAULT SPRITE PACK - matches IsoCity's sprites_red_water_new.webp
// Sprite sheet is 2048x2048, 5 cols x 6 rows = ~410x341 per sprite
// ============================================================================
export const SPRITE_PACK_DEFAULT: SpritePack = {
  id: 'default',
  name: 'Default Theme',
  src: '/assets/sprites_red_water_new.webp',
  cols: 5,
  rows: 6,
  layout: 'row',
  globalScale: 1.0,
  spriteOrder: [
    // Row 0 (indices 0-4)
    'residential', 'commercial', 'industrial', 'fire_station', 'hospital',
    // Row 1 (indices 5-9)
    'park', 'park_large', 'tennis', 'police_station', 'school',
    // Row 2 (indices 10-14)
    'university', 'water_tower', 'power_plant', 'stadium', 'space_program',
    // Row 3 (indices 15-19)
    'tree', 'house_medium', 'mansion', 'house_small', 'shop_medium',
    // Row 4 (indices 20-24)
    'shop_small', 'warehouse', 'factory_small', 'factory_medium', 'factory_large',
    // Row 5 (indices 25-29)
    'airport', 'subway_station', 'city_hall', 'museum', 'amusement_park',
  ] as const,
  verticalOffsets: {
    residential: -0.4,
    commercial: -0.4,
    industrial: -0.5,
    factory_small: -0.25,
    factory_medium: -0.3,
    factory_large: -1.15,
    water_tower: -0.5,
    house_medium: -0.3,
    mansion: -0.35,
    house_small: -0.3,
    shop_medium: -0.15,
    shop_small: -0.3,
    warehouse: -0.4,
    airport: -1.5,
    subway_station: -0.4,
    fire_station: -0.3,
    police_station: -0.2,
    hospital: -0.65,
    school: -0.35,
    power_plant: -0.3,
    park: -0.125,
    park_large: -0.77,
    tennis: -0.2,
    city_hall: -0.6,
    amusement_park: -1.5,
    space_program: -0.95,
    university: -0.55,
    stadium: -1.2,
    museum: -1.0,
    tree: -0.3,
  },
  horizontalOffsets: {
    university: 0.0,
    city_hall: 0.1,
  },
  buildingToSprite: {
    // Residential
    house_small: 'house_small',
    house_medium: 'house_medium',
    mansion: 'mansion',
    apartment_low: 'residential',
    apartment_high: 'residential',
    // Commercial
    shop_small: 'shop_small',
    shop_medium: 'shop_medium',
    office_low: 'commercial',
    office_high: 'commercial',
    mall: 'commercial',
    // Industrial
    factory_small: 'factory_small',
    factory_medium: 'factory_medium',
    factory_large: 'factory_large',
    warehouse: 'warehouse',
    // Services
    police_station: 'police_station',
    fire_station: 'fire_station',
    hospital: 'hospital',
    school: 'school',
    university: 'university',
    // Parks & Recreation
    park: 'park',
    park_large: 'park_large',
    tennis: 'tennis',
    // Utilities
    power_plant: 'power_plant',
    water_tower: 'water_tower',
    // Special
    stadium: 'stadium',
    museum: 'museum',
    airport: 'airport',
    space_program: 'space_program',
    subway_station: 'subway_station',
    city_hall: 'city_hall',
    amusement_park: 'amusement_park',
    tree: 'tree',
  },
};

// ============================================================================
// SPRITE PACKS REGISTRY
// ============================================================================
export const SPRITE_PACKS: SpritePack[] = [SPRITE_PACK_DEFAULT];

let activeSpritePack: SpritePack = SPRITE_PACKS[0];

export function setActiveSpritePack(pack: SpritePack) {
  activeSpritePack = pack;
}

export function getActiveSpritePack(): SpritePack {
  return activeSpritePack;
}

// ============================================================================
// SPRITE COORDINATE CALCULATION
// ============================================================================

export interface SpriteCoords {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Get sprite sheet coordinates for a building type
 */
export function getSpriteCoords(
  buildingType: string,
  sheetWidth: number,
  sheetHeight: number,
  pack: SpritePack = activeSpritePack
): SpriteCoords | null {
  const spriteKey = pack.buildingToSprite[buildingType];
  if (!spriteKey) {
    console.warn(`No sprite mapping for building type: ${buildingType}`);
    return null;
  }
  
  const index = pack.spriteOrder.indexOf(spriteKey);
  if (index === -1) {
    console.warn(`Sprite key not found in order: ${spriteKey}`);
    return null;
  }
  
  const tileWidth = sheetWidth / pack.cols;
  const tileHeight = sheetHeight / pack.rows;
  
  const col = index % pack.cols;
  const row = Math.floor(index / pack.cols);
  
  return {
    sx: col * tileWidth,
    sy: row * tileHeight,
    sw: tileWidth,
    sh: tileHeight,
  };
}

/**
 * Get vertical and horizontal offsets for a sprite
 */
export function getSpriteOffsets(
  buildingType: string,
  pack: SpritePack = activeSpritePack
): { vertical: number; horizontal: number } {
  const spriteKey = pack.buildingToSprite[buildingType];
  
  return {
    vertical: spriteKey ? (pack.verticalOffsets[spriteKey] ?? 0) : 0,
    horizontal: spriteKey ? (pack.horizontalOffsets[spriteKey] ?? 0) : 0,
  };
}

// ============================================================================
// BUILDING SIZE DEFINITIONS
// ============================================================================

export interface BuildingSize {
  width: number;
  height: number;
}

const BUILDING_SIZES: Record<string, BuildingSize> = {
  // 1x1 buildings
  house_small: { width: 1, height: 1 },
  house_medium: { width: 1, height: 1 },
  mansion: { width: 1, height: 1 },
  shop_small: { width: 1, height: 1 },
  shop_medium: { width: 1, height: 1 },
  factory_small: { width: 1, height: 1 },
  tree: { width: 1, height: 1 },
  park: { width: 1, height: 1 },
  water_tower: { width: 1, height: 1 },
  tennis: { width: 1, height: 1 },
  subway_station: { width: 1, height: 1 },
  // 2x2 buildings
  apartment_low: { width: 2, height: 2 },
  apartment_high: { width: 2, height: 2 },
  office_low: { width: 2, height: 2 },
  office_high: { width: 2, height: 2 },
  factory_medium: { width: 2, height: 2 },
  warehouse: { width: 2, height: 2 },
  police_station: { width: 2, height: 2 },
  fire_station: { width: 2, height: 2 },
  hospital: { width: 2, height: 2 },
  school: { width: 2, height: 2 },
  power_plant: { width: 2, height: 2 },
  park_large: { width: 2, height: 2 },
  museum: { width: 2, height: 2 },
  city_hall: { width: 2, height: 2 },
  // 3x3 buildings
  mall: { width: 3, height: 3 },
  factory_large: { width: 3, height: 3 },
  university: { width: 3, height: 3 },
  stadium: { width: 3, height: 3 },
  // 4x4 buildings
  airport: { width: 4, height: 4 },
  space_program: { width: 4, height: 4 },
  amusement_park: { width: 4, height: 4 },
};

export function getBuildingSize(buildingType: string): BuildingSize {
  return BUILDING_SIZES[buildingType] || { width: 1, height: 1 };
}

// ============================================================================
// SPRITE RENDERING INFO
// ============================================================================

export interface SpriteRenderInfo {
  coords: SpriteCoords;
  drawX: number;
  drawY: number;
  destWidth: number;
  destHeight: number;
  shouldFlip: boolean;
}

/**
 * Calculate complete rendering info for a building sprite
 */
export function getSpriteRenderInfo(
  buildingType: string,
  screenX: number,
  screenY: number,
  sheetWidth: number,
  sheetHeight: number,
  tileX: number = 0,
  tileY: number = 0,
  pack: SpritePack = activeSpritePack
): SpriteRenderInfo | null {
  const coords = getSpriteCoords(buildingType, sheetWidth, sheetHeight, pack);
  if (!coords) return null;
  
  const offsets = getSpriteOffsets(buildingType, pack);
  const buildingSize = getBuildingSize(buildingType);
  
  // Calculate scale - larger buildings need larger sprites
  const scale = Math.max(buildingSize.width, buildingSize.height) * (pack.globalScale ?? 1.0);
  
  // Destination size
  const destWidth = TILE_WIDTH * 1.5 * scale;
  const destHeight = (coords.sh / coords.sw) * destWidth;
  
  // Calculate draw position (center the sprite on the tile)
  const drawX = screenX - destWidth / 2 + offsets.horizontal * TILE_WIDTH;
  const drawY = screenY - destHeight + TILE_HEIGHT / 2 + offsets.vertical * TILE_HEIGHT;
  
  // Deterministic flip based on tile position for variety
  const shouldFlip = ((tileX + tileY) % 2) === 0;
  
  return {
    coords,
    drawX,
    drawY,
    destWidth,
    destHeight,
    shouldFlip,
  };
}
