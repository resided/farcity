// Pedestrian system - Walking citizens with behaviors

import { 
  Pedestrian, PedestrianState, PedestrianActivity, PedestrianDestType,
  CarDirection, Tile, TileType
} from '../types';
import {
  PEDESTRIAN_SKIN_COLORS,
  PEDESTRIAN_SHIRT_COLORS,
  PEDESTRIAN_PANTS_COLORS,
  PEDESTRIAN_HAT_COLORS,
  PEDESTRIAN_MAT_COLORS,
  PEDESTRIAN_BUILDING_ENTER_TIME,
  PEDESTRIAN_MIN_ACTIVITY_TIME,
  PEDESTRIAN_MAX_ACTIVITY_TIME,
  PEDESTRIAN_BUILDING_MIN_TIME,
  PEDESTRIAN_BUILDING_MAX_TIME,
  PEDESTRIAN_SOCIAL_CHANCE,
  PEDESTRIAN_SOCIAL_DURATION,
  PEDESTRIAN_DOG_CHANCE,
  PEDESTRIAN_BAG_CHANCE,
  PEDESTRIAN_HAT_CHANCE,
  PEDESTRIAN_IDLE_CHANCE,
  PEDESTRIAN_BEACH_MIN_TIME,
  PEDESTRIAN_BEACH_MAX_TIME,
  PEDESTRIAN_BEACH_SWIM_CHANCE,
  TILE_WIDTH,
  TILE_HEIGHT,
  DIRECTION_META,
} from './constants';
import { 
  gridToScreen, isRoadTile, findPathOnRoads, getDirectionToTile, 
  findNearestRoadToBuilding 
} from './utils';

// Recreation buildings where pedestrians can do activities
const RECREATION_BUILDINGS: TileType[] = [
  'park',
];

// Buildings pedestrians can enter
const ENTERABLE_BUILDINGS: TileType[] = [
  'building',
];

// Create a new pedestrian
export function createPedestrian(
  id: number,
  homeX: number,
  homeY: number,
  destX: number,
  destY: number,
  destType: PedestrianDestType,
  path: { x: number; y: number }[],
  startIndex: number,
  direction: CarDirection
): Pedestrian {
  const hasDog = destType === 'park' && Math.random() < PEDESTRIAN_DOG_CHANCE;
  const hasBag = (destType === 'commercial' || destType === 'industrial') && Math.random() < PEDESTRIAN_BAG_CHANCE;
  const hasHat = Math.random() < PEDESTRIAN_HAT_CHANCE;
  
  const startTile = path[startIndex];
  
  return {
    id,
    tileX: startTile.x,
    tileY: startTile.y,
    direction,
    progress: Math.random(),
    speed: 0.12 + Math.random() * 0.08,
    age: 0,
    maxAge: 120 + Math.random() * 180,
    skinColor: PEDESTRIAN_SKIN_COLORS[Math.floor(Math.random() * PEDESTRIAN_SKIN_COLORS.length)],
    shirtColor: PEDESTRIAN_SHIRT_COLORS[Math.floor(Math.random() * PEDESTRIAN_SHIRT_COLORS.length)],
    pantsColor: PEDESTRIAN_PANTS_COLORS[Math.floor(Math.random() * PEDESTRIAN_PANTS_COLORS.length)],
    hasHat,
    hatColor: hasHat ? PEDESTRIAN_HAT_COLORS[Math.floor(Math.random() * PEDESTRIAN_HAT_COLORS.length)] : '#000000',
    walkOffset: Math.random() * Math.PI * 2,
    sidewalkSide: Math.random() < 0.5 ? 'left' : 'right',
    destType,
    homeX,
    homeY,
    destX,
    destY,
    returningHome: false,
    path,
    pathIndex: startIndex,
    state: 'walking',
    activity: 'none',
    activityProgress: 0,
    activityDuration: 0,
    buildingEntryProgress: 0,
    socialTarget: null,
    activityOffsetX: 0,
    activityOffsetY: 0,
    activityAnimTimer: Math.random() * Math.PI * 2,
    hasBall: false,
    hasDog,
    hasBag,
    hasBeachMat: false,
    matColor: PEDESTRIAN_MAT_COLORS[Math.floor(Math.random() * PEDESTRIAN_MAT_COLORS.length)],
    beachTileX: -1,
    beachTileY: -1,
    beachEdge: null,
  };
}

// Update pedestrian state machine
export function updatePedestrian(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  grid: Tile[][],
  gridSize: number,
  allPedestrians: Pedestrian[]
): boolean {
  // Update age
  ped.age += delta;
  if (ped.age > ped.maxAge) {
    return false;
  }
  
  // Update animation timer
  ped.activityAnimTimer += delta * 4;
  
  switch (ped.state) {
    case 'walking':
      return updateWalkingState(ped, delta, speedMultiplier, grid, gridSize, allPedestrians);
    case 'idle':
      return updateIdleState(ped, delta, speedMultiplier);
    case 'socializing':
      return updateSocializingState(ped, delta, speedMultiplier, allPedestrians);
    case 'at_recreation':
      return updateRecreationState(ped, delta, speedMultiplier, grid, gridSize);
    case 'entering_building':
      return updateEnteringBuildingState(ped, delta, speedMultiplier);
    case 'inside_building':
      return updateInsideBuildingState(ped, delta, speedMultiplier, grid, gridSize);
    case 'exiting_building':
      return updateExitingBuildingState(ped, delta, speedMultiplier, grid, gridSize);
    default:
      return true;
  }
}

function updateWalkingState(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  grid: Tile[][],
  gridSize: number,
  allPedestrians: Pedestrian[]
): boolean {
  // Update walk animation
  ped.walkOffset += delta * 8;
  
  // Occasional social/idle checks
  const checkFrame = (ped.id + Math.floor(ped.age * 10)) % 60 === 0;
  
  if (checkFrame) {
    // Chance to socialize
    if (Math.random() < PEDESTRIAN_SOCIAL_CHANCE) {
      const nearbyPed = findNearbyPedestrian(ped, allPedestrians);
      if (nearbyPed) {
        ped.state = 'socializing';
        ped.socialTarget = nearbyPed.id;
        ped.activityDuration = PEDESTRIAN_SOCIAL_DURATION;
        ped.activityProgress = 0;
        ped.activityOffsetX = -8;
        ped.activityOffsetY = 0;
        
        nearbyPed.state = 'socializing';
        nearbyPed.socialTarget = ped.id;
        nearbyPed.activityDuration = PEDESTRIAN_SOCIAL_DURATION;
        nearbyPed.activityProgress = 0;
        nearbyPed.activityOffsetX = 8;
        nearbyPed.activityOffsetY = 0;
        
        return true;
      }
    }
    
    // Chance to idle
    if (Math.random() < PEDESTRIAN_IDLE_CHANCE) {
      ped.state = 'idle';
      ped.activityDuration = 1 + Math.random() * 2;
      ped.activityProgress = 0;
      return true;
    }
  }
  
  // Check if on road
  if (ped.progress < 0.1 && !isRoadTile(grid, gridSize, ped.tileX, ped.tileY)) {
    return false;
  }
  
  // Move along path
  ped.progress += ped.speed * delta * speedMultiplier;
  
  // Handle path progression
  while (ped.progress >= 1 && ped.pathIndex < ped.path.length - 1) {
    ped.pathIndex++;
    ped.progress -= 1;
    
    const currentTile = ped.path[ped.pathIndex];
    if (currentTile.x < 0 || currentTile.x >= gridSize ||
        currentTile.y < 0 || currentTile.y >= gridSize) {
      return false;
    }
    
    ped.tileX = currentTile.x;
    ped.tileY = currentTile.y;
    
    // Check if reached end of path
    if (ped.pathIndex >= ped.path.length - 1) {
      if (!ped.returningHome) {
        handleArrivalAtDestination(ped, grid, gridSize);
        return true;
      } else {
        return false;
      }
    }
    
    // Update direction
    if (ped.pathIndex + 1 < ped.path.length) {
      const nextTile = ped.path[ped.pathIndex + 1];
      const dir = getDirectionToTile(ped.tileX, ped.tileY, nextTile.x, nextTile.y);
      if (dir) ped.direction = dir;
    }
  }
  
  if (ped.progress >= 1 && ped.pathIndex >= ped.path.length - 1) {
    if (!ped.returningHome) {
      handleArrivalAtDestination(ped, grid, gridSize);
    } else {
      return false;
    }
  }
  
  return true;
}

function updateIdleState(ped: Pedestrian, delta: number, speedMultiplier: number): boolean {
  ped.activityProgress += delta * speedMultiplier / ped.activityDuration;
  
  if (ped.activityProgress >= 1) {
    ped.state = 'walking';
    ped.activityProgress = 0;
  }
  
  return true;
}

function updateSocializingState(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  allPedestrians: Pedestrian[]
): boolean {
  ped.activityProgress += delta * speedMultiplier / ped.activityDuration;
  
  // Check if partner still exists
  if (ped.socialTarget !== null) {
    const partner = allPedestrians.find(p => p.id === ped.socialTarget);
    if (!partner || partner.state !== 'socializing' || partner.socialTarget !== ped.id) {
      ped.state = 'walking';
      ped.socialTarget = null;
      ped.activityProgress = 0;
      ped.activityOffsetX = 0;
      ped.activityOffsetY = 0;
      return true;
    }
  }
  
  if (ped.activityProgress >= 1) {
    ped.state = 'walking';
    ped.socialTarget = null;
    ped.activityProgress = 0;
    ped.activityOffsetX = 0;
    ped.activityOffsetY = 0;
  }
  
  return true;
}

function updateRecreationState(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  grid: Tile[][],
  gridSize: number
): boolean {
  ped.activityProgress += delta * speedMultiplier / ped.activityDuration;
  
  // Animate based on activity
  if (ped.activity === 'jogging' || ped.activity === 'walking_dog') {
    ped.walkOffset += delta * (ped.activity === 'jogging' ? 10 : 4);
    const radius = ped.activity === 'jogging' ? 15 : 10;
    ped.activityOffsetX = Math.sin(ped.activityAnimTimer * 0.5) * radius;
    ped.activityOffsetY = Math.cos(ped.activityAnimTimer * 0.3) * radius * 0.6;
  }
  
  if (ped.activityProgress >= 1) {
    // Head home
    ped.hasBall = false;
    ped.activity = 'none';
    
    const returnPath = findPathOnRoads(grid, gridSize, ped.destX, ped.destY, ped.homeX, ped.homeY);
    if (returnPath && returnPath.length > 0) {
      ped.path = returnPath;
      ped.pathIndex = 0;
      ped.progress = 0;
      ped.tileX = returnPath[0].x;
      ped.tileY = returnPath[0].y;
      ped.state = 'walking';
      ped.returningHome = true;
      
      if (returnPath.length > 1) {
        const nextTile = returnPath[1];
        const dir = getDirectionToTile(returnPath[0].x, returnPath[0].y, nextTile.x, nextTile.y);
        if (dir) ped.direction = dir;
      }
    } else {
      return false;
    }
  }
  
  return true;
}

function updateEnteringBuildingState(ped: Pedestrian, delta: number, speedMultiplier: number): boolean {
  ped.buildingEntryProgress += delta * speedMultiplier / PEDESTRIAN_BUILDING_ENTER_TIME;
  
  if (ped.buildingEntryProgress >= 1) {
    ped.state = 'inside_building';
    ped.buildingEntryProgress = 1;
    ped.activityProgress = 0;
  }
  
  return true;
}

function updateInsideBuildingState(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  grid: Tile[][],
  gridSize: number
): boolean {
  ped.activityProgress += delta * speedMultiplier / ped.activityDuration;
  
  if (ped.activityProgress >= 1) {
    ped.state = 'exiting_building';
    ped.buildingEntryProgress = 1;
  }
  
  return true;
}

function updateExitingBuildingState(
  ped: Pedestrian,
  delta: number,
  speedMultiplier: number,
  grid: Tile[][],
  gridSize: number
): boolean {
  ped.buildingEntryProgress -= delta * speedMultiplier / PEDESTRIAN_BUILDING_ENTER_TIME;
  
  if (ped.buildingEntryProgress <= 0) {
    ped.buildingEntryProgress = 0;
    ped.activity = 'none';
    
    // Head home
    const returnPath = findPathOnRoads(grid, gridSize, ped.destX, ped.destY, ped.homeX, ped.homeY);
    if (returnPath && returnPath.length > 0) {
      ped.path = returnPath;
      ped.pathIndex = 0;
      ped.progress = 0;
      ped.tileX = returnPath[0].x;
      ped.tileY = returnPath[0].y;
      ped.state = 'walking';
      ped.returningHome = true;
      
      if (returnPath.length > 1) {
        const nextTile = returnPath[1];
        const dir = getDirectionToTile(returnPath[0].x, returnPath[0].y, nextTile.x, nextTile.y);
        if (dir) ped.direction = dir;
      }
    } else {
      return false;
    }
  }
  
  return true;
}

function handleArrivalAtDestination(ped: Pedestrian, grid: Tile[][], gridSize: number): void {
  const tile = grid[ped.destY]?.[ped.destX];
  if (!tile) return;
  
  const buildingType = tile.building?.type || tile.type;
  
  // Check if recreational
  if (RECREATION_BUILDINGS.includes(buildingType)) {
    ped.state = 'at_recreation';
    ped.activity = 'sitting_bench';
    ped.activityProgress = 0;
    ped.activityDuration = PEDESTRIAN_MIN_ACTIVITY_TIME + 
      Math.random() * (PEDESTRIAN_MAX_ACTIVITY_TIME - PEDESTRIAN_MIN_ACTIVITY_TIME);
    
    ped.activityOffsetX = (Math.random() - 0.5) * 20;
    ped.activityOffsetY = (Math.random() - 0.5) * 10;
  } else if (ENTERABLE_BUILDINGS.includes(buildingType)) {
    ped.state = 'entering_building';
    ped.buildingEntryProgress = 0;
    ped.activityDuration = PEDESTRIAN_BUILDING_MIN_TIME + 
      Math.random() * (PEDESTRIAN_BUILDING_MAX_TIME - PEDESTRIAN_BUILDING_MIN_TIME);
    ped.activity = 'working';
  } else {
    ped.returningHome = true;
  }
}

function findNearbyPedestrian(ped: Pedestrian, allPedestrians: Pedestrian[]): Pedestrian | null {
  const checkLimit = Math.min(20, allPedestrians.length);
  const startIdx = ped.id % Math.max(1, allPedestrians.length - checkLimit);
  
  for (let i = 0; i < checkLimit; i++) {
    const idx = (startIdx + i) % allPedestrians.length;
    const other = allPedestrians[idx];
    
    if (other.id === ped.id) continue;
    if (other.state !== 'walking') continue;
    if (other.socialTarget !== null) continue;
    
    const dist = Math.abs(other.tileX - ped.tileX) + Math.abs(other.tileY - ped.tileY);
    
    if (dist <= 1 && other.sidewalkSide !== ped.sidewalkSide) {
      return other;
    }
  }
  
  return null;
}

// Draw a pedestrian
export function drawPedestrian(
  ctx: CanvasRenderingContext2D,
  ped: Pedestrian,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(ped.tileX, ped.tileY, offsetX, offsetY);
  const meta = DIRECTION_META[ped.direction];
  
  // Position on sidewalk
  const sidewalkOffset = ped.sidewalkSide === 'left' ? -8 : 8;
  let pedX = screenX + TILE_WIDTH / 2 + meta.vec.dx * ped.progress + meta.normal.nx * sidewalkOffset;
  let pedY = screenY + TILE_HEIGHT / 2 + meta.vec.dy * ped.progress + meta.normal.ny * sidewalkOffset;
  
  // Add activity offset
  pedX += ped.activityOffsetX;
  pedY += ped.activityOffsetY;
  
  // Walking bob animation
  const bob = ped.state === 'walking' ? Math.sin(ped.walkOffset) * 1.5 : 0;
  pedY -= bob;
  
  // Opacity for entering/exiting buildings
  let opacity = 1;
  if (ped.state === 'entering_building') {
    opacity = 1 - ped.buildingEntryProgress;
  } else if (ped.state === 'exiting_building') {
    opacity = 1 - ped.buildingEntryProgress;
  } else if (ped.state === 'inside_building') {
    return; // Don't draw
  }
  
  ctx.globalAlpha = opacity;
  
  // Scale based on zoom
  const scale = Math.max(0.5, zoom);
  
  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(pedX, pedY + 1, 3 * scale, 1.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw body
  ctx.fillStyle = ped.pantsColor;
  ctx.fillRect(pedX - 2 * scale, pedY - 4 * scale, 4 * scale, 4 * scale);
  
  // Torso
  ctx.fillStyle = ped.shirtColor;
  ctx.fillRect(pedX - 2.5 * scale, pedY - 8 * scale, 5 * scale, 4 * scale);
  
  // Head
  ctx.fillStyle = ped.skinColor;
  ctx.beginPath();
  ctx.arc(pedX, pedY - 10 * scale, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat
  if (ped.hasHat) {
    ctx.fillStyle = ped.hatColor;
    ctx.fillRect(pedX - 3 * scale, pedY - 13 * scale, 6 * scale, 2 * scale);
  }
  
  // Walking arm swing
  if (ped.state === 'walking') {
    const armSwing = Math.sin(ped.walkOffset) * 2;
    
    // Arms
    ctx.fillStyle = ped.skinColor;
    ctx.fillRect(pedX - 3.5 * scale, pedY - 7 * scale + armSwing * scale * 0.5, 1 * scale, 3 * scale);
    ctx.fillRect(pedX + 2.5 * scale, pedY - 7 * scale - armSwing * scale * 0.5, 1 * scale, 3 * scale);
  }
  
  // Draw dog if has one
  if (ped.hasDog) {
    drawDog(ctx, pedX + 8 * scale, pedY, scale, ped.walkOffset);
  }
  
  // Draw bag if has one
  if (ped.hasBag) {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(pedX + 3 * scale, pedY - 6 * scale, 2 * scale, 4 * scale);
  }
  
  ctx.globalAlpha = 1;
}

function drawDog(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  walkOffset: number
) {
  const dogBob = Math.sin(walkOffset * 1.5) * 0.5;
  
  // Body
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(x - 4 * scale, y - 3 * scale + dogBob * scale, 6 * scale, 3 * scale);
  
  // Head
  ctx.beginPath();
  ctx.arc(x + 3 * scale, y - 3 * scale + dogBob * scale, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // Tail
  ctx.fillRect(x - 5 * scale, y - 4 * scale + dogBob * scale, 2 * scale, 1.5 * scale);
  
  // Legs (animated)
  const legOffset = Math.sin(walkOffset * 2) * scale;
  ctx.fillRect(x - 3 * scale + legOffset * 0.5, y - 1 * scale, 1 * scale, 2 * scale);
  ctx.fillRect(x + 1 * scale - legOffset * 0.5, y - 1 * scale, 1 * scale, 2 * scale);
}

// Draw all pedestrians
export function drawPedestrians(
  ctx: CanvasRenderingContext2D,
  pedestrians: Pedestrian[],
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  // Filter out invisible pedestrians
  const visible = pedestrians.filter(p => p.state !== 'inside_building');
  
  for (const ped of visible) {
    drawPedestrian(ctx, ped, offsetX, offsetY, zoom);
  }
}
