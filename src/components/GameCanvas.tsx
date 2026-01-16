'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store';
import { getBuildingById } from '@/lib/buildings';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  ZOOM_MIN,
  ZOOM_MAX,
  CAR_MIN_ZOOM,
  PEDESTRIAN_MIN_ZOOM,
} from '@/lib/rendering/constants';
import {
  gridToScreen,
  screenToGrid,
  isRoadTile,
} from '@/lib/rendering/utils';
import {
  drawHighlightedTile,
  drawZoneIndicator,
  isValidPlacement,
} from '@/lib/rendering/drawing';
import {
  spawnRandomCar,
  updateCar,
  drawCars,
} from '@/lib/rendering/vehicles';
import {
  createPedestrian,
  updatePedestrian,
  drawPedestrians,
} from '@/lib/rendering/pedestrians';
import {
  getSpriteCoords,
  getSpriteRenderInfo,
  getActiveSpritePack,
} from '@/lib/rendering/spriteConfig';
import { loadSpriteImage } from '@/lib/rendering/imageLoader';
import { Car, Pedestrian, Tile } from '@/lib/types';

// Sprite sheet paths
const SPRITE_SHEETS = {
  main: '/assets/sprites_red_water_new.webp',
  mainFallback: '/assets/sprites_red_water_new.png',
  water: '/assets/water.webp',
  waterFallback: '/assets/water.png',
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  // Sprite sheets
  const spriteSheetRef = useRef<HTMLImageElement | null>(null);
  const waterSheetRef = useRef<HTMLImageElement | null>(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  
  // Vehicle systems
  const carsRef = useRef<Car[]>([]);
  const carIdRef = useRef(0);
  const carSpawnTimerRef = useRef(0);
  const trafficLightTimerRef = useRef(0);
  
  // Pedestrian systems
  const pedestriansRef = useRef<Pedestrian[]>([]);
  const pedestrianIdRef = useRef(0);
  const pedestrianSpawnTimerRef = useRef(0);
  
  const {
    grid,
    gridSize,
    buildings,
    selectedBuilding,
    selectedTool,
    speed,
    placeBuilding,
    placeAtTile,
    selectBuilding,
    collectIncome,
    simulateTick,
    gameVersion,
  } = useGameStore();
  
  // Load sprite sheets
  useEffect(() => {
    const loadSprites = async () => {
      try {
        // Load main sprite sheet
        try {
          spriteSheetRef.current = await loadSpriteImage(SPRITE_SHEETS.main, true);
        } catch {
          spriteSheetRef.current = await loadSpriteImage(SPRITE_SHEETS.mainFallback, true);
        }
        
        // Load water sprite sheet
        try {
          waterSheetRef.current = await loadSpriteImage(SPRITE_SHEETS.water, false);
        } catch {
          waterSheetRef.current = await loadSpriteImage(SPRITE_SHEETS.waterFallback, false);
        }
        
        setSpritesLoaded(true);
      } catch (error) {
        console.error('Failed to load sprite sheets:', error);
      }
    };
    
    loadSprites();
  }, []);
  
  // Clear vehicles when game version changes (new game or loaded)
  useEffect(() => {
    carsRef.current = [];
    carIdRef.current = 0;
    pedestriansRef.current = [];
    pedestrianIdRef.current = 0;
  }, [gameVersion]);
  
  // Center the grid on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 4;
    setOffset({ x: centerX, y: centerY });
  }, []);
  
  // Collect income periodically
  useEffect(() => {
    const interval = setInterval(() => {
      collectIncome();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [collectIncome]);
  
  // Simulation tick
  useEffect(() => {
    if (speed === 0) return;
    
    const tickInterval = speed === 1 ? 2000 : speed === 2 ? 1000 : 500;
    const interval = setInterval(() => {
      simulateTick();
    }, tickInterval);
    
    return () => clearInterval(interval);
  }, [speed, simulateTick]);
  
  // Draw sprite from sheet
  const drawSprite = useCallback((
    ctx: CanvasRenderingContext2D,
    buildingType: string,
    screenX: number,
    screenY: number,
    tileX: number,
    tileY: number
  ): boolean => {
    const sheet = spriteSheetRef.current;
    if (!sheet) return false;
    
    const renderInfo = getSpriteRenderInfo(
      buildingType,
      screenX,
      screenY,
      sheet.width,
      sheet.height,
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
        sheet,
        coords.sx, coords.sy, coords.sw, coords.sh,
        0, 0, destWidth, destHeight
      );
    } else {
      ctx.drawImage(
        sheet,
        coords.sx, coords.sy, coords.sw, coords.sh,
        drawX, drawY, destWidth, destHeight
      );
    }
    
    ctx.restore();
    
    return true;
  }, []);
  
  // Draw grass tile with sprite-like appearance
  const drawGrassTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    gridX: number,
    gridY: number
  ) => {
    const seed = (gridX * 31 + gridY * 17) % 100;
    const shade = 0.9 + (seed / 500);
    
    // Create isometric grass tile
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.closePath();
    
    // Natural grass gradient
    const gradient = ctx.createLinearGradient(
      x - TILE_WIDTH / 2, y,
      x + TILE_WIDTH / 2, y + TILE_HEIGHT
    );
    gradient.addColorStop(0, `rgb(${Math.floor(74 * shade)}, ${Math.floor(117 * shade)}, ${Math.floor(58 * shade)})`);
    gradient.addColorStop(0.5, `rgb(${Math.floor(62 * shade)}, ${Math.floor(99 * shade)}, ${Math.floor(49 * shade)})`);
    gradient.addColorStop(1, `rgb(${Math.floor(52 * shade)}, ${Math.floor(85 * shade)}, ${Math.floor(42 * shade)})`);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Subtle grid line
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, []);
  
  // Draw water tile
  const drawWaterTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ) => {
    const wave = Math.sin(time / 800 + x * 0.05) * 1.5;
    
    ctx.beginPath();
    ctx.moveTo(x, y + wave);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + wave);
    ctx.lineTo(x, y + TILE_HEIGHT + wave);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2 + wave);
    ctx.closePath();
    
    // Deep water gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + TILE_HEIGHT);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(0.3, '#2a5078');
    gradient.addColorStop(0.7, '#1e3a5f');
    gradient.addColorStop(1, '#162d4a');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Water shimmer
    const shimmer = (Math.sin(time / 400 + x * 0.1 + y * 0.1) + 1) / 2;
    ctx.fillStyle = `rgba(100, 180, 255, ${shimmer * 0.15})`;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, []);
  
  // Draw road tile
  const drawRoadTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    gridX: number,
    gridY: number,
    g: Tile[][],
    gSize: number,
    trafficTime: number,
    z: number
  ) => {
    // Check adjacent roads
    const hasNorth = gridY > 0 && isRoadTile(g, gSize, gridX, gridY - 1);
    const hasSouth = gridY < gSize - 1 && isRoadTile(g, gSize, gridX, gridY + 1);
    const hasEast = gridX < gSize - 1 && isRoadTile(g, gSize, gridX + 1, gridY);
    const hasWest = gridX > 0 && isRoadTile(g, gSize, gridX - 1, gridY);
    
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    
    // Road base
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = '#3a3a3a';
    ctx.fill();
    
    // Sidewalk edges
    const sidewalkWidth = w * 0.1;
    ctx.fillStyle = '#5a5a5a';
    
    if (!hasNorth) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - w / 2, y + h / 2);
      ctx.lineTo(x - w / 2 + sidewalkWidth, y + h / 2 - sidewalkWidth * 0.5);
      ctx.lineTo(x, y + sidewalkWidth * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    
    if (!hasEast) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w / 2 - sidewalkWidth, y + h / 2 - sidewalkWidth * 0.5);
      ctx.lineTo(x, y + sidewalkWidth * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    
    if (!hasSouth) {
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w / 2, y + h / 2);
      ctx.lineTo(x + w / 2 - sidewalkWidth, y + h / 2 + sidewalkWidth * 0.5);
      ctx.lineTo(x, y + h - sidewalkWidth * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    
    if (!hasWest) {
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x - w / 2, y + h / 2);
      ctx.lineTo(x - w / 2 + sidewalkWidth, y + h / 2 + sidewalkWidth * 0.5);
      ctx.lineTo(x, y + h - sidewalkWidth * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Lane markings
    if (z >= 0.5) {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]);
      
      const cx = x;
      const cy = y + h / 2;
      
      if (hasNorth && hasSouth) {
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.2, cy - h * 0.2);
        ctx.lineTo(cx + w * 0.2, cy + h * 0.2);
        ctx.stroke();
      }
      
      if (hasEast && hasWest) {
        ctx.beginPath();
        ctx.moveTo(cx + w * 0.2, cy - h * 0.2);
        ctx.lineTo(cx - w * 0.2, cy + h * 0.2);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
    
    // Traffic light at intersections
    const connections = [hasNorth, hasSouth, hasEast, hasWest].filter(Boolean).length;
    if (connections >= 3 && z >= 0.6) {
      const cycleTime = trafficTime % 7.6;
      let lightColor: string;
      
      if (cycleTime < 3) {
        lightColor = '#22c55e';
      } else if (cycleTime < 3.8) {
        lightColor = '#eab308';
      } else if (cycleTime < 6.8) {
        lightColor = '#ef4444';
      } else {
        lightColor = '#eab308';
      }
      
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.arc(x, y - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow
      ctx.shadowColor = lightColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);
  
  // Draw rail tile
  const drawRailTile = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    const w = TILE_WIDTH;
    const h = TILE_HEIGHT;
    
    // Gravel base
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w / 2, y + h / 2);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - w / 2, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = '#4a4a4a';
    ctx.fill();
    
    // Rail tracks
    ctx.strokeStyle = '#8a8a8a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, y + h * 0.35);
    ctx.lineTo(x + w * 0.35, y + h * 0.65);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, y + h * 0.45);
    ctx.lineTo(x + w * 0.35, y + h * 0.75);
    ctx.stroke();
    
    // Cross ties
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      const offset = i * w * 0.12;
      ctx.beginPath();
      ctx.moveTo(x + offset - w * 0.08, y + h * 0.5 + offset * 0.5 - h * 0.08);
      ctx.lineTo(x + offset + w * 0.08, y + h * 0.5 + offset * 0.5 + h * 0.08);
      ctx.stroke();
    }
  }, []);
  
  // Main render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const now = performance.now();
    const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = now;
    timeRef.current = now;
    
    const speedMultiplier = speed === 0 ? 0 : speed === 1 ? 1 : speed === 2 ? 2.5 : 4;
    
    // Update traffic light timer
    trafficLightTimerRef.current += delta * speedMultiplier;
    
    // Spawn and update cars
    if (zoom >= CAR_MIN_ZOOM) {
      let roadTileCount = 0;
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          if (isRoadTile(grid, gridSize, x, y)) {
            roadTileCount++;
          }
        }
      }
      
      const maxCars = Math.min(100, Math.max(10, Math.floor(roadTileCount * 0.3)));
      
      carSpawnTimerRef.current -= delta;
      if (carsRef.current.length < maxCars && carSpawnTimerRef.current <= 0) {
        const car = spawnRandomCar(grid, gridSize, carIdRef.current++, false);
        if (car) {
          carsRef.current.push(car);
        }
        carSpawnTimerRef.current = 0.5 + Math.random() * 0.5;
      }
      
      carsRef.current = carsRef.current.filter(car =>
        updateCar(car, grid, gridSize, delta, speedMultiplier, trafficLightTimerRef.current, carsRef.current)
      );
    } else {
      carsRef.current = [];
    }
    
    // Spawn and update pedestrians
    if (zoom >= PEDESTRIAN_MIN_ZOOM) {
      const maxPedestrians = Math.min(200, Math.max(20, carsRef.current.length * 3));
      
      pedestrianSpawnTimerRef.current -= delta;
      if (pedestriansRef.current.length < maxPedestrians && pedestrianSpawnTimerRef.current <= 0) {
        const residentials: { x: number; y: number }[] = [];
        const destinations: { x: number; y: number; type: 'residential' | 'commercial' | 'industrial' | 'park' }[] = [];
        
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const tile = grid[y][x];
            if (tile.zone === 'residential' && tile.building.population > 0) {
              residentials.push({ x, y });
            }
            if (tile.zone === 'commercial' && tile.building.jobs > 0) {
              destinations.push({ x, y, type: 'commercial' });
            }
            if (tile.zone === 'industrial' && tile.building.jobs > 0) {
              destinations.push({ x, y, type: 'industrial' });
            }
            if (tile.type === 'park') {
              destinations.push({ x, y, type: 'park' });
            }
          }
        }
        
        if (residentials.length > 0 && destinations.length > 0) {
          const home = residentials[Math.floor(Math.random() * residentials.length)];
          const dest = destinations[Math.floor(Math.random() * destinations.length)];
          
          const path: { x: number; y: number }[] = [];
          let cx = home.x, cy = home.y;
          path.push({ x: cx, y: cy });
          
          for (let i = 0; i < 50 && (cx !== dest.x || cy !== dest.y); i++) {
            const dx = dest.x - cx;
            const dy = dest.y - cy;
            
            if (Math.abs(dx) > Math.abs(dy)) {
              const nx = cx + Math.sign(dx);
              if (isRoadTile(grid, gridSize, nx, cy)) {
                cx = nx;
                path.push({ x: cx, y: cy });
                continue;
              }
            }
            
            const ny = cy + Math.sign(dy);
            if (isRoadTile(grid, gridSize, cx, ny)) {
              cy = ny;
              path.push({ x: cx, y: cy });
              continue;
            }
            
            const nx = cx + Math.sign(dx);
            if (isRoadTile(grid, gridSize, nx, cy)) {
              cx = nx;
              path.push({ x: cx, y: cy });
              continue;
            }
            
            break;
          }
          
          if (path.length >= 3) {
            const ped = createPedestrian(
              pedestrianIdRef.current++,
              home.x, home.y,
              dest.x, dest.y,
              dest.type,
              path,
              0,
              'south'
            );
            pedestriansRef.current.push(ped);
          }
        }
        
        pedestrianSpawnTimerRef.current = 0.5;
      }
      
      pedestriansRef.current = pedestriansRef.current.filter(ped =>
        updatePedestrian(ped, delta, speedMultiplier, grid, gridSize, pedestriansRef.current)
      );
    } else {
      pedestriansRef.current = [];
    }
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and offset
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(offset.x / zoom, offset.y / zoom);
    
    // Draw tiles in proper order (back to front)
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y][x];
        const { screenX, screenY } = gridToScreen(x, y, 0, 0);
        
        // Draw base tile
        switch (tile.type) {
          case 'grass':
          case 'empty':
            drawGrassTile(ctx, screenX, screenY, x, y);
            break;
            
          case 'water':
            drawWaterTile(ctx, screenX, screenY, timeRef.current);
            break;
            
          case 'road':
            drawRoadTile(ctx, screenX, screenY, x, y, grid, gridSize, trafficLightTimerRef.current, zoom);
            break;
            
          case 'rail':
            drawRailTile(ctx, screenX, screenY);
            break;
            
          case 'park':
            drawGrassTile(ctx, screenX, screenY, x, y);
            // Try sprite, fallback to procedural
            if (!drawSprite(ctx, 'park', screenX, screenY, x, y)) {
              // Procedural park
              ctx.fillStyle = '#4a8a43';
              ctx.beginPath();
              ctx.arc(screenX, screenY + TILE_HEIGHT / 2, 8, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case 'tree':
            drawGrassTile(ctx, screenX, screenY, x, y);
            // Try sprite, fallback to procedural
            if (!drawSprite(ctx, 'tree', screenX, screenY, x, y)) {
              // Procedural tree
              const seed = (x * 31 + y * 17) % 100;
              const trunkHeight = 8 + (seed % 4);
              const foliageSize = 14 + (seed % 6);
              
              ctx.fillStyle = '#5d4037';
              ctx.fillRect(screenX - 2, screenY + TILE_HEIGHT * 0.3 - trunkHeight, 4, trunkHeight);
              
              ctx.fillStyle = '#2d5a27';
              ctx.beginPath();
              ctx.arc(screenX, screenY + TILE_HEIGHT * 0.3 - trunkHeight - foliageSize / 2, foliageSize / 2, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
            
          case 'building':
            drawGrassTile(ctx, screenX, screenY, x, y);
            
            // Draw zone building using sprites
            if (tile.building.constructionProgress >= 100) {
              // Determine building type - check for service buildings first
              let buildingType: string;
              const level = tile.building.level;
              
              // Service buildings have a buildingId set
              if (tile.building.buildingId) {
                buildingType = tile.building.buildingId;
              } else if (tile.zone === 'residential') {
                if (level <= 1) buildingType = 'house_small';
                else if (level <= 2) buildingType = 'house_medium';
                else if (level <= 3) buildingType = 'mansion';
                else buildingType = 'apartment_low';
              } else if (tile.zone === 'commercial') {
                if (level <= 1) buildingType = 'shop_small';
                else if (level <= 2) buildingType = 'shop_medium';
                else buildingType = 'office_low';
              } else if (tile.zone === 'industrial') {
                if (level <= 1) buildingType = 'factory_small';
                else if (level <= 2) buildingType = 'factory_medium';
                else buildingType = 'warehouse';
              } else {
                // Fallback for service buildings without buildingId
                buildingType = 'house_small';
              }
              
              // Try sprite rendering
              if (!drawSprite(ctx, buildingType, screenX, screenY, x, y)) {
                // Fallback procedural building
                const buildingColor = tile.zone === 'residential' ? '#22c55e' :
                                     tile.zone === 'commercial' ? '#3b82f6' : '#eab308';
                const height = TILE_HEIGHT * (1 + level * 0.5);
                
                // Simple 3D box
                // Left face
                ctx.fillStyle = shadeColor(buildingColor, -20);
                ctx.beginPath();
                ctx.moveTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.35);
                ctx.lineTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.35 - height);
                ctx.lineTo(screenX, screenY - height);
                ctx.lineTo(screenX, screenY);
                ctx.closePath();
                ctx.fill();
                
                // Right face
                ctx.fillStyle = shadeColor(buildingColor, -40);
                ctx.beginPath();
                ctx.moveTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.65);
                ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.65 - height);
                ctx.lineTo(screenX, screenY - height);
                ctx.lineTo(screenX, screenY);
                ctx.closePath();
                ctx.fill();
                
                // Top face
                ctx.fillStyle = buildingColor;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY - height);
                ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.15 - height);
                ctx.lineTo(screenX, screenY + TILE_HEIGHT * 0.3 - height);
                ctx.lineTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.15 - height);
                ctx.closePath();
                ctx.fill();
                
                // Windows
                ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
                const windowRows = Math.floor(height / 15);
                for (let row = 0; row < windowRows; row++) {
                  ctx.fillRect(screenX - 5, screenY - 10 - row * 12, 3, 5);
                  ctx.fillRect(screenX + 2, screenY - 10 - row * 12, 3, 5);
                }
              }
            } else {
              // Construction site
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(screenX - TILE_WIDTH * 0.25, screenY - TILE_HEIGHT, TILE_WIDTH * 0.5, TILE_HEIGHT);
              ctx.setLineDash([]);
              
              // Progress bar
              const progress = tile.building.constructionProgress / 100;
              ctx.fillStyle = '#1f2937';
              ctx.fillRect(screenX - 15, screenY - 5, 30, 4);
              ctx.fillStyle = '#f97316';
              ctx.fillRect(screenX - 15, screenY - 5, 30 * progress, 4);
            }
            break;
            
          default:
            drawGrassTile(ctx, screenX, screenY, x, y);
        }
        
        // Draw zone indicator
        if (tile.zone !== 'none' && tile.building.type !== 'building') {
          drawZoneIndicator(ctx, screenX, screenY, tile.zone);
        }
      }
    }
    
    // Draw cars
    if (zoom >= CAR_MIN_ZOOM) {
      drawCars(ctx, carsRef.current, 0, 0, zoom);
    }
    
    // Draw pedestrians
    if (zoom >= PEDESTRIAN_MIN_ZOOM) {
      drawPedestrians(ctx, pedestriansRef.current, 0, 0, zoom);
    }
    
    // Draw legacy placed buildings (service buildings etc)
    const sortedBuildings = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const placed of sortedBuildings) {
      const building = getBuildingById(placed.buildingId);
      if (!building) continue;
      
      const { screenX, screenY } = gridToScreen(
        placed.x + building.size.width / 2 - 0.5,
        placed.y + building.size.height / 2 - 0.5,
        0, 0
      );
      
      // Try to draw sprite for service buildings
      const serviceMapping: Record<string, string> = {
        'police': 'police_station',
        'fire': 'fire_station',
        'hospital': 'hospital',
        'school': 'school',
        'power': 'power_plant',
        'water': 'water_tower',
      };
      
      let drawnAsSprite = false;
      for (const [key, spriteType] of Object.entries(serviceMapping)) {
        if (building.id.includes(key)) {
          drawnAsSprite = drawSprite(ctx, spriteType, screenX, screenY, placed.x, placed.y);
          break;
        }
      }
      
      // Fallback to procedural drawing if sprite fails
      if (!drawnAsSprite) {
        drawBuildingProcedural(ctx, building, screenX, screenY, placed.level, timeRef.current);
      }
    }
    
    // Draw building preview
    if (selectedBuilding && hoveredTile) {
      const building = getBuildingById(selectedBuilding);
      if (building) {
        const valid = isValidPlacement(
          hoveredTile.x,
          hoveredTile.y,
          building,
          buildings,
          gridSize,
          getBuildingById
        );
        
        for (let dy = 0; dy < building.size.height; dy++) {
          for (let dx = 0; dx < building.size.width; dx++) {
            const { screenX, screenY } = gridToScreen(
              hoveredTile.x + dx,
              hoveredTile.y + dy,
              0, 0
            );
            drawHighlightedTile(ctx, screenX, screenY, valid);
          }
        }
      }
    }
    
    // Draw tool preview
    if (selectedTool !== 'select' && hoveredTile) {
      const { screenX, screenY } = gridToScreen(hoveredTile.x, hoveredTile.y, 0, 0);
      const valid = hoveredTile.x >= 0 && hoveredTile.x < gridSize && 
                   hoveredTile.y >= 0 && hoveredTile.y < gridSize;
      drawHighlightedTile(ctx, screenX, screenY, valid);
    }
    
    ctx.restore();
    
    animationRef.current = requestAnimationFrame(render);
  }, [grid, gridSize, buildings, selectedBuilding, selectedTool, offset, zoom, speed, hoveredTile, drawSprite, drawGrassTile, drawWaterTile, drawRoadTile, drawRailTile]);
  
  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);
  
  // Resize canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const { isoX, isoY } = screenToGrid(
        e.clientX / zoom - offset.x / zoom,
        e.clientY / zoom - offset.y / zoom,
        0, 0
      );
      if (isoX >= 0 && isoX < gridSize && isoY >= 0 && isoY < gridSize) {
        setHoveredTile({ x: isoX, y: isoY });
      } else {
        setHoveredTile(null);
      }
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - (dragStart.x + offset.x), 2) +
        Math.pow(e.clientY - (dragStart.y + offset.y), 2)
      );
      
      if (dragDistance < 5 && hoveredTile) {
        if (selectedBuilding) {
        const building = getBuildingById(selectedBuilding);
          if (building && isValidPlacement(hoveredTile.x, hoveredTile.y, building, buildings, gridSize, getBuildingById)) {
          placeBuilding(selectedBuilding, hoveredTile.x, hoveredTile.y);
          }
        } else if (selectedTool !== 'select') {
          placeAtTile(hoveredTile.x, hoveredTile.y);
        }
      }
    }
    setIsDragging(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * delta));
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleChange = newZoom / zoom;
      const newOffsetX = mouseX - (mouseX - offset.x) * scaleChange;
      const newOffsetY = mouseY - (mouseY - offset.y) * scaleChange;
      
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
    
    setZoom(newZoom);
  };
  
  // Touch handlers
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoom);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistanceRef.current = Math.hypot(dx, dy);
      initialZoomRef.current = zoom;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const scale = distance / initialPinchDistanceRef.current;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, initialZoomRef.current * scale));
      setZoom(newZoom);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const distance = Math.hypot(dx, dy);
      const duration = Date.now() - touchStartRef.current.time;
      
      if (distance < 10 && duration < 300) {
        const { isoX, isoY } = screenToGrid(
          touch.clientX / zoom - offset.x / zoom,
          touch.clientY / zoom - offset.y / zoom,
          0, 0
        );
        
        if (isoX >= 0 && isoX < gridSize && isoY >= 0 && isoY < gridSize) {
          if (selectedTool !== 'select') {
            placeAtTile(isoX, isoY);
          }
        }
      }
    }
    
    setIsDragging(false);
    touchStartRef.current = null;
    initialPinchDistanceRef.current = null;
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredTile(null);
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}

// Helper: shade color
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

// Procedural building fallback
function drawBuildingProcedural(
  ctx: CanvasRenderingContext2D,
  building: { color: string; accentColor: string; size: { width: number; height: number } },
  x: number,
  y: number,
  level: number,
  time: number
) {
  const { color, accentColor, size } = building;
  const buildingHeight = TILE_HEIGHT * (2 + Math.min(level, 5));
  
  const baseWidth = size.width * TILE_WIDTH / 2;
  const baseHeight = size.height * TILE_HEIGHT / 2;
  
  // Left face
  ctx.beginPath();
  ctx.moveTo(x - baseWidth / 2, y + baseHeight / 2);
  ctx.lineTo(x - baseWidth / 2, y + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, y - buildingHeight);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -20);
  ctx.fill();
  
  // Right face
  ctx.beginPath();
  ctx.moveTo(x + baseWidth / 2, y + baseHeight / 2);
  ctx.lineTo(x + baseWidth / 2, y + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, y - buildingHeight);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = shadeColor(color, -40);
  ctx.fill();
  
  // Top face
  ctx.beginPath();
  ctx.moveTo(x, y - buildingHeight);
  ctx.lineTo(x + baseWidth / 2, y + baseHeight / 2 - buildingHeight);
  ctx.lineTo(x, y + baseHeight - buildingHeight);
  ctx.lineTo(x - baseWidth / 2, y + baseHeight / 2 - buildingHeight);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  // Windows
  ctx.fillStyle = accentColor;
  const windowRows = Math.floor(buildingHeight / 12);
  const windowCols = Math.floor(baseWidth / 16);
  
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const wx = x - baseWidth / 4 + col * 8 - row * 2;
      const wy = y - 8 - row * 12;
      ctx.fillRect(wx - 2, wy - 3, 4, 6);
    }
  }
}
