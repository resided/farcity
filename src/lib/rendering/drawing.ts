// Isometric drawing functions

import { TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH, ROAD_COLORS } from './constants';
import { gridToScreen, shadeColor, getRarityBonus, getAdjacentRoads } from './utils';
import { Tile, Building, PlacedBuilding } from '../types';

// Draw an isometric tile (ground)
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = '#1a1a2e',
  borderColor: string = '#2d2d4a'
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Draw grass tile with natural variation
export function drawGrassTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gridX: number,
  gridY: number
) {
  // Use grid position for consistent variation
  const seed = (gridX * 31 + gridY * 17) % 100;
  const shade = seed / 100 * 10 - 5;
  const baseColor = shadeColor('#2d5a27', shade);
  
  drawTile(ctx, x, y, baseColor, '#1f4a1f');
  
  // Add small grass details at higher zoom
  if (seed % 3 === 0) {
    ctx.fillStyle = '#3a7a33';
    ctx.beginPath();
    ctx.arc(x + (seed % 20) - 10, y + TILE_HEIGHT / 2 + (seed % 10) - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw water tile with animation
export function drawWaterTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
) {
  const wave = Math.sin(time / 500 + x * 0.1) * 2;
  
  ctx.beginPath();
  ctx.moveTo(x, y + wave);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + wave);
  ctx.lineTo(x, y + TILE_HEIGHT + wave);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + wave);
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(x, y, x, y + TILE_HEIGHT);
  gradient.addColorStop(0, '#1e40af');
  gradient.addColorStop(0.5, '#2563eb');
  gradient.addColorStop(1, '#3b82f6');
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add shimmer effect
  ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time / 300) * 0.05})`;
  ctx.fill();
}

// Draw a highlighted tile for selection/preview
export function drawHighlightedTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  valid: boolean = true
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  
  ctx.fillStyle = valid ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
  ctx.fill();
  ctx.strokeStyle = valid ? '#8B5CF6' : '#EF4444';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Draw zone indicator on tile
export function drawZoneIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  zone: 'residential' | 'commercial' | 'industrial'
) {
  const colors = {
    residential: 'rgba(34, 197, 94, 0.3)',
    commercial: 'rgba(59, 130, 246, 0.3)',
    industrial: 'rgba(234, 179, 8, 0.3)',
  };
  
  const borderColors = {
    residential: '#22c55e',
    commercial: '#3b82f6',
    industrial: '#eab308',
  };
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.lineTo(x, y + TILE_HEIGHT);
  ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
  ctx.closePath();
  
  ctx.fillStyle = colors[zone];
  ctx.fill();
  ctx.strokeStyle = borderColors[zone];
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Draw road tile with proper lane markings
export function drawRoadTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gridX: number,
  gridY: number,
  grid: Tile[][],
  gridSize: number,
  trafficTime: number,
  zoom: number
) {
  const adj = getAdjacentRoads(grid, gridSize, gridX, gridY);
  const w = TILE_WIDTH;
  const h = TILE_HEIGHT;
  
  // Draw asphalt base
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = ROAD_COLORS.ASPHALT;
  ctx.fill();
  
  // Draw sidewalk edges
  const sidewalkWidth = w * 0.08;
  ctx.fillStyle = ROAD_COLORS.SIDEWALK;
  
  // Top-left edge
  if (!adj.north) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.lineTo(x - w / 2 + sidewalkWidth * 0.707, y + h / 2 - sidewalkWidth * 0.707);
    ctx.lineTo(x + sidewalkWidth * 0.707, y + sidewalkWidth * 0.707);
    ctx.closePath();
    ctx.fill();
  }
  
  // Top-right edge
  if (!adj.east) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w / 2 - sidewalkWidth * 0.707, y + h / 2 - sidewalkWidth * 0.707);
    ctx.lineTo(x - sidewalkWidth * 0.707, y + sidewalkWidth * 0.707);
    ctx.closePath();
    ctx.fill();
  }
  
  // Bottom-right edge
  if (!adj.south) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x + w / 2 - sidewalkWidth * 0.707, y + h / 2 + sidewalkWidth * 0.707);
    ctx.lineTo(x - sidewalkWidth * 0.707, y + h - sidewalkWidth * 0.707);
    ctx.closePath();
    ctx.fill();
  }
  
  // Bottom-left edge  
  if (!adj.west) {
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.lineTo(x - w / 2 + sidewalkWidth * 0.707, y + h / 2 + sidewalkWidth * 0.707);
    ctx.lineTo(x + sidewalkWidth * 0.707, y + h - sidewalkWidth * 0.707);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw lane markings if zoomed in enough
  if (zoom >= 0.5) {
    ctx.strokeStyle = ROAD_COLORS.CENTER_LINE;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 3]);
    
    const cx = x;
    const cy = y + h / 2;
    
    // Draw center lines based on connections
    if (adj.north && adj.south) {
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.25, cy - h * 0.25);
      ctx.lineTo(cx + w * 0.25, cy + h * 0.25);
      ctx.stroke();
    }
    
    if (adj.east && adj.west) {
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.25, cy - h * 0.25);
      ctx.lineTo(cx - w * 0.25, cy + h * 0.25);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }
  
  // Draw intersection traffic lights if 3+ connections
  const connectionCount = [adj.north, adj.east, adj.south, adj.west].filter(Boolean).length;
  if (connectionCount >= 3 && zoom >= 0.6) {
    drawTrafficLight(ctx, x, y, trafficTime);
  }
}

// Draw traffic light at intersection
function drawTrafficLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
) {
  const cycleTime = time % 7600;
  
  let lightColor: string;
  if (cycleTime < 3000) {
    lightColor = ROAD_COLORS.TRAFFIC_LIGHT_GREEN;
  } else if (cycleTime < 3800) {
    lightColor = ROAD_COLORS.TRAFFIC_LIGHT_YELLOW;
  } else if (cycleTime < 6800) {
    lightColor = ROAD_COLORS.TRAFFIC_LIGHT_RED;
  } else {
    lightColor = ROAD_COLORS.TRAFFIC_LIGHT_YELLOW;
  }
  
  // Draw small traffic light indicator
  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Add glow effect
  ctx.shadowColor = lightColor;
  ctx.shadowBlur = 4;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Draw a building with isometric projection
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  x: number,
  y: number,
  level: number = 1,
  time: number = 0
) {
  const { color, accentColor, size, animation, rarity } = building;
  const buildingHeight = TILE_DEPTH * (2 + Math.min(level, 5) + getRarityBonus(rarity));
  
  // Animation offset
  let animOffset = 0;
  let glowIntensity = 0;
  
  if (animation === 'float') {
    animOffset = Math.sin(time / 500) * 3;
  } else if (animation === 'pulse') {
    glowIntensity = (Math.sin(time / 300) + 1) / 2;
  } else if (animation === 'glow') {
    glowIntensity = (Math.sin(time / 400) + 1) / 2 * 0.6;
  }
  
  const adjustedY = y - animOffset;
  
  // Glow effect for animated buildings
  if (glowIntensity > 0) {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 15 * glowIntensity;
  }
  
  // Draw building base for multi-tile buildings
  const baseWidth = size.width * TILE_WIDTH / 2;
  const baseHeight = size.height * TILE_HEIGHT / 2;
  
  // Left face
  ctx.beginPath();
  ctx.moveTo(x - baseWidth / 2, adjustedY + baseHeight / 2);
  ctx.lineTo(x - baseWidth / 2, adjustedY + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, adjustedY - buildingHeight);
  ctx.lineTo(x, adjustedY);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -20);
  ctx.fill();
  
  // Right face
  ctx.beginPath();
  ctx.moveTo(x + baseWidth / 2, adjustedY + baseHeight / 2);
  ctx.lineTo(x + baseWidth / 2, adjustedY + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, adjustedY - buildingHeight);
  ctx.lineTo(x, adjustedY);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -40);
  ctx.fill();
  
  // Top face
  ctx.beginPath();
  ctx.moveTo(x, adjustedY - buildingHeight);
  ctx.lineTo(x + baseWidth / 2, adjustedY + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, adjustedY + baseHeight - buildingHeight);
  ctx.lineTo(x - baseWidth / 2, adjustedY + baseHeight / 2 - buildingHeight);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Draw windows
  drawWindows(ctx, x, adjustedY, buildingHeight, baseWidth, baseHeight, accentColor);
  
  // Draw special effects for legendary buildings
  if (animation === 'sparkle') {
    drawSparkles(ctx, x, adjustedY - buildingHeight / 2, time, accentColor);
  }
  
  // Draw level indicator
  if (level > 1) {
    drawLevelBadge(ctx, x, adjustedY - buildingHeight - 10, level);
  }
}

function drawWindows(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  baseWidth: number,
  baseHeight: number,
  windowColor: string
) {
  const windowRows = Math.floor(height / 12);
  const windowCols = Math.floor(baseWidth / 16);
  
  ctx.fillStyle = windowColor;
  
  // Left face windows
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const wx = x - baseWidth / 4 + col * 8 - row * 2;
      const wy = y - 8 - row * 12;
      ctx.fillRect(wx - 2, wy - 3, 4, 6);
    }
  }
  
  // Right face windows
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const wx = x + baseWidth / 4 - col * 8 + row * 2;
      const wy = y - 8 - row * 12;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(wx - 2, wy - 3, 4, 6);
      ctx.globalAlpha = 1;
    }
  }
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  color: string
) {
  const sparkleCount = 5;
  
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (time / 1000 + i * (Math.PI * 2 / sparkleCount)) % (Math.PI * 2);
    const radius = 20 + Math.sin(time / 200 + i) * 5;
    const sx = x + Math.cos(angle) * radius;
    const sy = y + Math.sin(angle) * radius * 0.5;
    const size = 2 + Math.sin(time / 100 + i * 2) * 1;
    
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Star shape
    ctx.beginPath();
    ctx.moveTo(sx - size * 2, sy);
    ctx.lineTo(sx + size * 2, sy);
    ctx.moveTo(sx, sy - size * 2);
    ctx.lineTo(sx, sy + size * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawLevelBadge(ctx: CanvasRenderingContext2D, x: number, y: number, level: number) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#8B5CF6';
  ctx.fill();
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(level.toString(), x, y);
}

// Draw tree
export function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number
) {
  const trunkHeight = 8 + (seed % 4);
  const foliageSize = 12 + (seed % 6);
  
  // Trunk
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(x - 2, y - trunkHeight, 4, trunkHeight);
  
  // Foliage - multiple layered circles for natural look
  const greenShades = ['#2d5a27', '#3a7a33', '#4a8a43'];
  
  for (let i = 0; i < 3; i++) {
    const layerY = y - trunkHeight - (i * 4);
    const layerSize = foliageSize - (i * 3);
    
    ctx.beginPath();
    ctx.arc(x + (seed % 3) - 1, layerY, layerSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = greenShades[i % greenShades.length];
    ctx.fill();
  }
}

// Draw park tile
export function drawPark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  gridX: number,
  gridY: number
) {
  // Green base
  drawTile(ctx, x, y, '#3a7a33', '#2d5a27');
  
  // Add decorative elements based on position
  const seed = (gridX * 31 + gridY * 17) % 100;
  
  // Park bench or small tree
  if (seed % 4 === 0) {
    // Small bush
    ctx.fillStyle = '#4a8a43';
    ctx.beginPath();
    ctx.arc(x, y + TILE_HEIGHT / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (seed % 4 === 1) {
    // Flower
    ctx.fillStyle = seed % 2 === 0 ? '#ec4899' : '#eab308';
    ctx.beginPath();
    ctx.arc(x + 5, y + TILE_HEIGHT / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 5, y + TILE_HEIGHT / 2 + 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw the entire game grid
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  offsetX: number,
  offsetY: number
) {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const { screenX, screenY } = gridToScreen(x, y, offsetX, offsetY);
      
      // Alternate tile colors for visual interest
      const isEven = (x + y) % 2 === 0;
      drawTile(
        ctx,
        screenX,
        screenY,
        isEven ? '#12121f' : '#161627',
        '#252540'
      );
    }
  }
}

// Draw all placed buildings with proper depth sorting
export function drawBuildings(
  ctx: CanvasRenderingContext2D,
  buildings: PlacedBuilding[],
  getBuildingById: (id: string) => Building | undefined,
  offsetX: number,
  offsetY: number,
  time: number
) {
  // Sort buildings by position for correct rendering order (depth sort)
  const sortedBuildings = [...buildings].sort((a, b) => {
    return (a.x + a.y) - (b.x + b.y);
  });
  
  for (const placed of sortedBuildings) {
    const building = getBuildingById(placed.buildingId);
    if (!building) continue;
    
    const { screenX, screenY } = gridToScreen(
      placed.x + building.size.width / 2 - 0.5,
      placed.y + building.size.height / 2 - 0.5,
      offsetX,
      offsetY
    );
    
    drawBuilding(ctx, building, screenX, screenY, placed.level, time);
  }
}

// Check if a position is valid for placing a building
export function isValidPlacement(
  gridX: number,
  gridY: number,
  building: Building,
  placedBuildings: PlacedBuilding[],
  gridSize: number,
  getBuildingById: (id: string) => Building | undefined
): boolean {
  const { width, height } = building.size;
  
  // Check bounds
  if (gridX < 0 || gridY < 0 || gridX + width > gridSize || gridY + height > gridSize) {
    return false;
  }
  
  // Check collision with existing buildings
  for (const placed of placedBuildings) {
    const existingBuilding = getBuildingById(placed.buildingId);
    if (!existingBuilding) continue;
    
    const overlap = !(
      gridX + width <= placed.x ||
      gridX >= placed.x + existingBuilding.size.width ||
      gridY + height <= placed.y ||
      gridY >= placed.y + existingBuilding.size.height
    );
    
    if (overlap) return false;
  }
  
  return true;
}
