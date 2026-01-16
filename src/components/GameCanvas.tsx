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
  DIRECTION_META,
} from '@/lib/rendering/constants';
import {
  gridToScreen,
  screenToGrid,
  isRoadTile,
  shadeColor,
} from '@/lib/rendering/utils';
import {
  drawTile,
  drawGrassTile,
  drawWaterTile,
  drawHighlightedTile,
  drawZoneIndicator,
  drawRoadTile,
  drawBuilding,
  drawTree,
  drawPark,
  isValidPlacement,
} from '@/lib/rendering/drawing';
import {
  spawnRandomCar,
  updateCar,
  drawCars,
  getTrafficLightState,
} from '@/lib/rendering/vehicles';
import {
  createPedestrian,
  updatePedestrian,
  drawPedestrians,
} from '@/lib/rendering/pedestrians';
import { Car, Pedestrian, Tile } from '@/lib/types';

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
      // Count road tiles for scaling
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
      
      // Update cars
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
        // Find residential and destination tiles
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
          
          // Simple path along roads
          const path: { x: number; y: number }[] = [];
          let cx = home.x, cy = home.y;
          path.push({ x: cx, y: cy });
          
          // Move towards destination
          for (let i = 0; i < 50 && (cx !== dest.x || cy !== dest.y); i++) {
            const dx = dest.x - cx;
            const dy = dest.y - cy;
            
            // Try to move in the dominant direction
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
            
            // Try perpendicular
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
      
      // Update pedestrians
      pedestriansRef.current = pedestriansRef.current.filter(ped =>
        updatePedestrian(ped, delta, speedMultiplier, grid, gridSize, pedestriansRef.current)
      );
    } else {
      pedestriansRef.current = [];
    }
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(0.5, '#0a0a12');
    gradient.addColorStop(1, '#050508');
    ctx.fillStyle = gradient;
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
            // Draw rail with darker color
            drawTile(ctx, screenX, screenY, '#3a3a4a', '#2a2a3a');
            // Rail tracks
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.35);
            ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.65);
            ctx.moveTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.45);
            ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.75);
            ctx.stroke();
            break;
            
          case 'park':
            drawPark(ctx, screenX, screenY, x, y);
            break;
            
          case 'tree':
            drawGrassTile(ctx, screenX, screenY, x, y);
            drawTree(ctx, screenX, screenY + TILE_HEIGHT * 0.3, (x * 31 + y * 17) % 100);
            break;
            
          case 'building':
            drawGrassTile(ctx, screenX, screenY, x, y);
            // Draw zone building
            if (tile.building.constructionProgress >= 100) {
              const buildingColor = tile.zone === 'residential' ? '#22c55e' :
                                   tile.zone === 'commercial' ? '#3b82f6' : '#eab308';
              const height = TILE_HEIGHT * (1 + tile.building.level * 0.5);
              
              // Building body
              ctx.fillStyle = shadeColor(buildingColor, -20);
              ctx.beginPath();
              ctx.moveTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.35);
              ctx.lineTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.35 - height);
              ctx.lineTo(screenX, screenY - height);
              ctx.lineTo(screenX, screenY);
              ctx.closePath();
              ctx.fill();
              
              ctx.fillStyle = shadeColor(buildingColor, -40);
              ctx.beginPath();
              ctx.moveTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.65);
              ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.65 - height);
              ctx.lineTo(screenX, screenY - height);
              ctx.lineTo(screenX, screenY);
              ctx.closePath();
              ctx.fill();
              
              ctx.fillStyle = buildingColor;
              ctx.beginPath();
              ctx.moveTo(screenX, screenY - height);
              ctx.lineTo(screenX + TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.15 - height);
              ctx.lineTo(screenX, screenY + TILE_HEIGHT * 0.3 - height);
              ctx.lineTo(screenX - TILE_WIDTH * 0.3, screenY + TILE_HEIGHT * 0.15 - height);
              ctx.closePath();
              ctx.fill();
              
              // Windows
              ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
              const windowRows = Math.floor(height / 15);
              for (let row = 0; row < windowRows; row++) {
                ctx.fillRect(screenX - 5, screenY - 10 - row * 12, 3, 5);
                ctx.fillRect(screenX + 2, screenY - 10 - row * 12, 3, 5);
              }
            } else {
              // Construction scaffolding
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
    
    // Draw legacy placed buildings (from original system)
    const sortedBuildings = [...buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const placed of sortedBuildings) {
      const building = getBuildingById(placed.buildingId);
      if (!building) continue;
      
      const { screenX, screenY } = gridToScreen(
        placed.x + building.size.width / 2 - 0.5,
        placed.y + building.size.height / 2 - 0.5,
        0, 0
      );
      
      drawBuilding(ctx, building, screenX, screenY, placed.level, timeRef.current);
    }
    
    // Draw building preview if one is selected
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
  }, [grid, gridSize, buildings, selectedBuilding, selectedTool, offset, zoom, speed, hoveredTile]);
  
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
      
      // Only handle click if not dragging
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
    
    // Zoom towards mouse position
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
  
  // Touch handlers for mobile
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
      // Pinch zoom
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
      
      // Tap detection
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
