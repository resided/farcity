// Sprite-based rendering for isometric buildings
// Uses the sprite sheets from isometric-city

import { TILE_WIDTH, TILE_HEIGHT } from './constants';
import { loadSpriteImage, getCachedImage, isImageCached } from './imageLoader';
import { getSpriteCoords, getSpriteRenderInfo, getActiveSpritePack, getBuildingSize } from './spriteConfig';

// Sprite sheet source
const SPRITE_SHEET_SRC = '/assets/sprites_red_water_new.webp';

// Track sprite sheet loading
let spriteSheetLoaded = false;
let spriteSheetLoading = false;
let spriteSheet: HTMLImageElement | null = null;

/**
 * Initialize sprite sheet loading
 */
export async function initSpriteSheet(): Promise<void> {
  if (spriteSheetLoaded || spriteSheetLoading) return;
  
  spriteSheetLoading = true;
  
  try {
    spriteSheet = await loadSpriteImage(SPRITE_SHEET_SRC, true);
    spriteSheetLoaded = true;
  } catch (error) {
    console.error('Failed to load sprite sheet:', error);
    // Try PNG fallback
    try {
      spriteSheet = await loadSpriteImage('/assets/sprites_red_water_new.png', true);
      spriteSheetLoaded = true;
    } catch (fallbackError) {
      console.error('Failed to load fallback sprite sheet:', fallbackError);
    }
  }
  
  spriteSheetLoading = false;
}

/**
 * Check if sprite sheet is ready
 */
export function isSpriteSheetReady(): boolean {
  return spriteSheetLoaded && spriteSheet !== null;
}

/**
 * Get the loaded sprite sheet
 */
export function getSpriteSheet(): HTMLImageElement | null {
  return spriteSheet;
}

/**
 * Draw a building sprite at the given screen position
 */
export function drawBuildingSprite(
  ctx: CanvasRenderingContext2D,
  buildingType: string,
  screenX: number,
  screenY: number,
  tileX: number = 0,
  tileY: number = 0
): boolean {
  if (!spriteSheet) return false;
  
  const renderInfo = getSpriteRenderInfo(
    buildingType,
    screenX,
    screenY,
    spriteSheet.width,
    spriteSheet.height,
    tileX,
    tileY
  );
  
  if (!renderInfo) return false;
  
  const { coords, drawX, drawY, destWidth, destHeight, shouldFlip } = renderInfo;
  
  ctx.save();
  
  if (shouldFlip) {
    ctx.translate(drawX + destWidth, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(
      spriteSheet,
      coords.sx, coords.sy, coords.sw, coords.sh,
      0, 0, destWidth, destHeight
    );
  } else {
    ctx.drawImage(
      spriteSheet,
      coords.sx, coords.sy, coords.sw, coords.sh,
      drawX, drawY, destWidth, destHeight
    );
  }
  
  ctx.restore();
  
  return true;
}

/**
 * Draw a zone building (residential/commercial/industrial) based on level
 */
export function drawZoneBuilding(
  ctx: CanvasRenderingContext2D,
  zone: 'residential' | 'commercial' | 'industrial',
  level: number,
  screenX: number,
  screenY: number,
  tileX: number,
  tileY: number,
  constructionProgress: number = 100
): boolean {
  if (!spriteSheet) return false;
  
  // Map zone + level to building type
  let buildingType: string;
  
  if (zone === 'residential') {
    if (level <= 1) buildingType = 'house_small';
    else if (level <= 2) buildingType = 'house_medium';
    else if (level <= 3) buildingType = 'mansion';
    else buildingType = 'apartment_low';
  } else if (zone === 'commercial') {
    if (level <= 1) buildingType = 'shop_small';
    else if (level <= 2) buildingType = 'shop_medium';
    else buildingType = 'office_low';
  } else {
    if (level <= 1) buildingType = 'factory_small';
    else if (level <= 2) buildingType = 'factory_medium';
    else buildingType = 'warehouse';
  }
  
  // Draw construction scaffolding if not complete
  if (constructionProgress < 100) {
    drawConstructionSite(ctx, screenX, screenY, constructionProgress);
    return true;
  }
  
  return drawBuildingSprite(ctx, buildingType, screenX, screenY, tileX, tileY);
}

/**
 * Draw construction site placeholder
 */
function drawConstructionSite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  progress: number
) {
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  // Foundation
  ctx.fillStyle = '#4a4a4a';
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + w / 2, screenY + h / 2);
  ctx.lineTo(screenX, screenY + h);
  ctx.lineTo(screenX - w / 2, screenY + h / 2);
  ctx.closePath();
  ctx.fill();
  
  // Scaffolding
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  
  const scaffoldHeight = 30 * (progress / 100);
  ctx.strokeRect(screenX - w * 0.25, screenY - scaffoldHeight, w * 0.5, scaffoldHeight);
  
  ctx.setLineDash([]);
  
  // Progress bar
  const barWidth = 30;
  const barHeight = 4;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(screenX - barWidth / 2, screenY - 8, barWidth, barHeight);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(screenX - barWidth / 2, screenY - 8, barWidth * (progress / 100), barHeight);
}

/**
 * Draw a tree sprite
 */
export function drawTreeSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileX: number,
  tileY: number
): boolean {
  return drawBuildingSprite(ctx, 'tree', screenX, screenY, tileX, tileY);
}

/**
 * Draw a park sprite
 */
export function drawParkSprite(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileX: number,
  tileY: number
): boolean {
  return drawBuildingSprite(ctx, 'park', screenX, screenY, tileX, tileY);
}

/**
 * Draw a service building sprite
 */
export function drawServiceBuilding(
  ctx: CanvasRenderingContext2D,
  serviceType: 'police_station' | 'fire_station' | 'hospital' | 'school' | 'power_plant' | 'water_tower',
  screenX: number,
  screenY: number,
  tileX: number,
  tileY: number
): boolean {
  return drawBuildingSprite(ctx, serviceType, screenX, screenY, tileX, tileY);
}
