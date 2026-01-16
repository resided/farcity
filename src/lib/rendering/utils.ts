// Isometric rendering utilities

import { TILE_WIDTH, TILE_HEIGHT, DIRECTION_META } from './constants';
import { Tile, CarDirection, TileType } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface IsoPoint {
  isoX: number;
  isoY: number;
}

// Convert grid coordinates to screen coordinates (isometric projection)
export function gridToScreen(gridX: number, gridY: number, offsetX: number = 0, offsetY: number = 0): { screenX: number; screenY: number } {
  const screenX = (gridX - gridY) * (TILE_WIDTH / 2) + offsetX;
  const screenY = (gridX + gridY) * (TILE_HEIGHT / 2) + offsetY;
  return { screenX, screenY };
}

// Convert screen coordinates back to grid coordinates
export function screenToGrid(screenX: number, screenY: number, offsetX: number = 0, offsetY: number = 0): IsoPoint {
  const adjustedX = screenX - offsetX;
  const adjustedY = screenY - offsetY;
  
  const isoX = (adjustedX / (TILE_WIDTH / 2) + adjustedY / (TILE_HEIGHT / 2)) / 2;
  const isoY = (adjustedY / (TILE_HEIGHT / 2) - adjustedX / (TILE_WIDTH / 2)) / 2;
  
  return { isoX: Math.floor(isoX), isoY: Math.floor(isoY) };
}

// Check if a tile is a road or road bridge
export function isRoadTile(grid: Tile[][], gridSize: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false;
  const tile = grid[y]?.[x];
  if (!tile) return false;
  const type = tile.building?.type || tile.type;
  return type === 'road' || (type === 'bridge' && tile.building?.type !== 'rail');
}

// Check if a tile is a rail tile
export function isRailTile(grid: Tile[][], gridSize: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return false;
  const tile = grid[y]?.[x];
  if (!tile) return false;
  const type = tile.building?.type || tile.type;
  return type === 'rail';
}

// Get available direction options from a tile
export function getDirectionOptions(grid: Tile[][], gridSize: number, x: number, y: number): CarDirection[] {
  const options: CarDirection[] = [];
  
  // Check north (-1, 0)
  if (isRoadTile(grid, gridSize, x - 1, y)) options.push('north');
  // Check south (+1, 0)
  if (isRoadTile(grid, gridSize, x + 1, y)) options.push('south');
  // Check east (0, -1)
  if (isRoadTile(grid, gridSize, x, y - 1)) options.push('east');
  // Check west (0, +1)
  if (isRoadTile(grid, gridSize, x, y + 1)) options.push('west');
  
  return options;
}

// Get adjacent roads for a tile
export function getAdjacentRoads(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number
): { north: boolean; east: boolean; south: boolean; west: boolean } {
  return {
    north: isRoadTile(grid, gridSize, x - 1, y),
    east: isRoadTile(grid, gridSize, x, y - 1),
    south: isRoadTile(grid, gridSize, x + 1, y),
    west: isRoadTile(grid, gridSize, x, y + 1),
  };
}

// Pick next direction preferring to continue straight
export function pickNextDirection(
  currentDirection: CarDirection,
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number
): CarDirection | null {
  const options = getDirectionOptions(grid, gridSize, x, y);
  if (options.length === 0) return null;
  
  // Prefer to continue in same direction
  if (options.includes(currentDirection)) {
    // 70% chance to continue straight
    if (Math.random() < 0.7) return currentDirection;
  }
  
  // Otherwise pick a random option, preferring not to go back
  const opposites: Record<CarDirection, CarDirection> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
  };
  
  const filtered = options.filter(d => d !== opposites[currentDirection]);
  if (filtered.length > 0) {
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  
  return options[Math.floor(Math.random() * options.length)];
}

// Get direction from one tile to another
export function getDirectionToTile(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): CarDirection | null {
  const dx = toX - fromX;
  const dy = toY - fromY;
  
  if (dx === -1 && dy === 0) return 'north';
  if (dx === 1 && dy === 0) return 'south';
  if (dx === 0 && dy === -1) return 'east';
  if (dx === 0 && dy === 1) return 'west';
  
  return null;
}

// Simple A* pathfinding on roads
type PathNode = { x: number; y: number; g: number; f: number; parent: string | null };

export function findPathOnRoads(
  grid: Tile[][],
  gridSize: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] | null {
  // Find nearest road to start
  const start = findNearestRoad(grid, gridSize, startX, startY);
  const end = findNearestRoad(grid, gridSize, endX, endY);
  
  if (!start || !end) return null;
  
  const openSet = new Map<string, PathNode>();
  const closedSet = new Set<string>();
  const allNodes = new Map<string, PathNode>(); // Store all visited nodes for path reconstruction
  
  const startKey = `${start.x},${start.y}`;
  const endKey = `${end.x},${end.y}`;
  
  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    f: heuristic(start.x, start.y, end.x, end.y),
    parent: null,
  };
  openSet.set(startKey, startNode);
  allNodes.set(startKey, startNode);
  
  while (openSet.size > 0) {
    // Find node with lowest f score
    let currentKey: string | null = null;
    let currentNode: PathNode | null = null;
    let lowestF = Infinity;
    
    for (const [key, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentKey = key;
        currentNode = node;
      }
    }
    
    if (!currentKey || !currentNode) break;
    
    // Check if we reached the end
    if (currentKey === endKey) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let key: string | null = currentKey;
      
      while (key) {
        const node = allNodes.get(key);
        if (node) {
          path.unshift({ x: node.x, y: node.y });
          key = node.parent;
        } else {
          break;
        }
      }
      
      return path;
    }
    
    openSet.delete(currentKey);
    closedSet.add(currentKey);
    
    // Check neighbors
    const neighbors = [
      { x: currentNode.x - 1, y: currentNode.y },
      { x: currentNode.x + 1, y: currentNode.y },
      { x: currentNode.x, y: currentNode.y - 1 },
      { x: currentNode.x, y: currentNode.y + 1 },
    ];
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      if (closedSet.has(neighborKey)) continue;
      if (!isRoadTile(grid, gridSize, neighbor.x, neighbor.y)) continue;
      
      const g = currentNode.g + 1;
      const f = g + heuristic(neighbor.x, neighbor.y, end.x, end.y);
      
      const existingNode = openSet.get(neighborKey);
      if (!existingNode || g < existingNode.g) {
        const newNode: PathNode = {
          x: neighbor.x,
          y: neighbor.y,
          g,
          f,
          parent: currentKey,
        };
        openSet.set(neighborKey, newNode);
        allNodes.set(neighborKey, newNode);
      }
    }
  }
  
  return null;
}

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// Find nearest road tile to a position
export function findNearestRoad(
  grid: Tile[][],
  gridSize: number,
  x: number,
  y: number
): { x: number; y: number } | null {
  // Check current tile first
  if (isRoadTile(grid, gridSize, x, y)) {
    return { x, y };
  }
  
  // Spiral outward
  for (let r = 1; r <= 10; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (isRoadTile(grid, gridSize, nx, ny)) {
          return { x: nx, y: ny };
        }
      }
    }
  }
  
  return null;
}

// Find nearest road to a building
export function findNearestRoadToBuilding(
  grid: Tile[][],
  gridSize: number,
  buildingX: number,
  buildingY: number
): { x: number; y: number } | null {
  return findNearestRoad(grid, gridSize, buildingX, buildingY);
}

// Shade a color (darken or lighten)
export function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 0 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

// Get rarity bonus for building height
export function getRarityBonus(rarity: string): number {
  switch (rarity) {
    case 'common': return 0;
    case 'uncommon': return 1;
    case 'rare': return 2;
    case 'epic': return 3;
    case 'legendary': return 5;
    default: return 0;
  }
}
