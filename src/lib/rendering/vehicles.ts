// Vehicle systems - Cars, Buses, Trains, Emergency Vehicles

import { 
  Car, Bus, EmergencyVehicle, Train, CarDirection, Tile 
} from '../types';
import { 
  CAR_COLORS, BUS_COLORS, DIRECTION_META, TILE_WIDTH, TILE_HEIGHT,
  TRAFFIC_LIGHT_TIMING
} from './constants';
import { 
  gridToScreen, isRoadTile, getDirectionOptions, pickNextDirection, 
  getDirectionToTile, findPathOnRoads 
} from './utils';

// Traffic light state
export type TrafficLightState = 'green_ns' | 'yellow_ns' | 'green_ew' | 'yellow_ew';

// Get traffic light state based on time
export function getTrafficLightState(time: number): TrafficLightState {
  const cycleTime = time % TRAFFIC_LIGHT_TIMING.TOTAL_CYCLE;
  
  if (cycleTime < TRAFFIC_LIGHT_TIMING.GREEN_DURATION) {
    return 'green_ns';
  } else if (cycleTime < TRAFFIC_LIGHT_TIMING.GREEN_DURATION + TRAFFIC_LIGHT_TIMING.YELLOW_DURATION) {
    return 'yellow_ns';
  } else if (cycleTime < TRAFFIC_LIGHT_TIMING.GREEN_DURATION * 2 + TRAFFIC_LIGHT_TIMING.YELLOW_DURATION) {
    return 'green_ew';
  } else {
    return 'yellow_ew';
  }
}

// Check if vehicle can proceed through intersection
export function canProceedThroughIntersection(
  direction: CarDirection,
  lightState: TrafficLightState
): boolean {
  if (direction === 'north' || direction === 'south') {
    return lightState === 'green_ns' || lightState === 'yellow_ns';
  }
  return lightState === 'green_ew' || lightState === 'yellow_ew';
}

// Spawn a random car
export function spawnRandomCar(
  grid: Tile[][],
  gridSize: number,
  carId: number,
  isMobile: boolean
): Car | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const tileX = Math.floor(Math.random() * gridSize);
    const tileY = Math.floor(Math.random() * gridSize);
    
    if (!isRoadTile(grid, gridSize, tileX, tileY)) continue;
    
    const options = getDirectionOptions(grid, gridSize, tileX, tileY);
    if (options.length === 0) continue;
    
    const direction = options[Math.floor(Math.random() * options.length)];
    const baseLaneOffset = 4 + Math.random() * 2;
    const laneSign = (direction === 'north' || direction === 'east') ? 1 : -1;
    const carMaxAge = isMobile 
      ? 25 + Math.random() * 15
      : 45 + Math.random() * 30;
    
    return {
      id: carId,
      tileX,
      tileY,
      direction,
      progress: Math.random() * 0.8,
      speed: (0.35 + Math.random() * 0.35) * 0.7,
      age: 0,
      maxAge: carMaxAge,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      laneOffset: laneSign * baseLaneOffset,
    };
  }
  
  return null;
}

// Update car position and handle intersections
export function updateCar(
  car: Car,
  grid: Tile[][],
  gridSize: number,
  delta: number,
  speedMultiplier: number,
  trafficLightTimer: number,
  cars: Car[]
): boolean {
  // Update age
  car.age += delta * speedMultiplier;
  if (car.age > car.maxAge) {
    return false; // Car should be removed
  }
  
  // Check if still on road
  if (!isRoadTile(grid, gridSize, car.tileX, car.tileY)) {
    // Try to relocate
    for (let r = 1; r <= 5; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) === r || Math.abs(dy) === r) {
            const nx = car.tileX + dx;
            const ny = car.tileY + dy;
            if (isRoadTile(grid, gridSize, nx, ny)) {
              car.tileX = nx;
              car.tileY = ny;
              car.progress = 0.5;
              const opts = getDirectionOptions(grid, gridSize, nx, ny);
              if (opts.length > 0) {
                car.direction = opts[Math.floor(Math.random() * opts.length)];
              }
              return true;
            }
          }
        }
      }
    }
    return true; // Keep car but skip update
  }
  
  // Check for traffic light
  const lightState = getTrafficLightState(trafficLightTimer);
  const meta = DIRECTION_META[car.direction];
  const nextX = car.tileX + meta.step.x;
  const nextY = car.tileY + meta.step.y;
  
  // Check if approaching intersection
  const currentOptions = getDirectionOptions(grid, gridSize, car.tileX, car.tileY);
  const nextOptions = getDirectionOptions(grid, gridSize, nextX, nextY);
  const currentIsIntersection = currentOptions.length >= 3;
  const nextIsIntersection = nextOptions.length >= 3;
  
  let shouldStop = false;
  
  // Stop before entering intersection on red
  if (!currentIsIntersection && nextIsIntersection && car.progress > 0.7) {
    if (!canProceedThroughIntersection(car.direction, lightState)) {
      shouldStop = true;
    }
  }
  
  // Check for car ahead
  if (!shouldStop) {
    for (const other of cars) {
      if (other.id === car.id) continue;
      if (other.tileX === car.tileX && other.tileY === car.tileY) {
        if (other.direction === car.direction && other.progress > car.progress) {
          const gap = other.progress - car.progress;
          if (gap < 0.25) {
            shouldStop = true;
            break;
          }
        }
      }
    }
  }
  
  if (!shouldStop) {
    car.progress += car.speed * delta * speedMultiplier;
  }
  
  // Handle tile transition
  while (car.progress >= 1) {
    const newTileX = car.tileX + meta.step.x;
    const newTileY = car.tileY + meta.step.y;
    
    if (!isRoadTile(grid, gridSize, newTileX, newTileY)) {
      // Turn around
      const options = getDirectionOptions(grid, gridSize, car.tileX, car.tileY);
      if (options.length > 0) {
        const newDir = options.filter(d => d !== car.direction)[0] || options[0];
        car.direction = newDir;
        car.progress = 0.1;
        const baseLaneOffset = 4 + Math.random() * 2;
        const laneSign = (newDir === 'north' || newDir === 'east') ? 1 : -1;
        car.laneOffset = laneSign * baseLaneOffset;
      }
      break;
    }
    
    car.tileX = newTileX;
    car.tileY = newTileY;
    car.progress -= 1;
    
    // Pick next direction
    const nextDirection = pickNextDirection(car.direction, grid, gridSize, car.tileX, car.tileY);
    if (nextDirection && nextDirection !== car.direction) {
      car.direction = nextDirection;
      const baseLaneOffset = 4 + Math.random() * 2;
      const laneSign = (nextDirection === 'north' || nextDirection === 'east') ? 1 : -1;
      car.laneOffset = laneSign * baseLaneOffset;
    }
  }
  
  return true;
}

// Draw a car
export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(car.tileX, car.tileY, offsetX, offsetY);
  const centerX = screenX + TILE_WIDTH / 2;
  const centerY = screenY + TILE_HEIGHT / 2;
  const meta = DIRECTION_META[car.direction];
  
  const carX = centerX + meta.vec.dx * car.progress + meta.normal.nx * car.laneOffset;
  const carY = centerY + meta.vec.dy * car.progress + meta.normal.ny * car.laneOffset;
  
  ctx.save();
  ctx.translate(carX, carY);
  ctx.rotate(meta.angle);
  
  const scale = 0.5;
  
  // Car body
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.moveTo(-10 * scale, -5 * scale);
  ctx.lineTo(10 * scale, -5 * scale);
  ctx.lineTo(12 * scale, 0);
  ctx.lineTo(10 * scale, 5 * scale);
  ctx.lineTo(-10 * scale, 5 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Windshield
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(-4 * scale, -2.8 * scale, 7 * scale, 5.6 * scale);
  
  // Rear
  ctx.fillStyle = '#111827';
  ctx.fillRect(-10 * scale, -4 * scale, 2.4 * scale, 8 * scale);
  
  ctx.restore();
}

// Draw all cars
export function drawCars(
  ctx: CanvasRenderingContext2D,
  cars: Car[],
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  for (const car of cars) {
    drawCar(ctx, car, offsetX, offsetY, zoom);
  }
}

// Draw a bus
export function drawBus(
  ctx: CanvasRenderingContext2D,
  bus: Bus,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(bus.tileX, bus.tileY, offsetX, offsetY);
  const centerX = screenX + TILE_WIDTH / 2;
  const centerY = screenY + TILE_HEIGHT / 2;
  const meta = DIRECTION_META[bus.direction];
  
  const busX = centerX + meta.vec.dx * bus.progress + meta.normal.nx * bus.laneOffset;
  const busY = centerY + meta.vec.dy * bus.progress + meta.normal.ny * bus.laneOffset;
  
  ctx.save();
  ctx.translate(busX, busY);
  ctx.rotate(meta.angle);
  
  const scale = 0.6;
  const length = 20 * scale;
  const width = 7 * scale;
  
  // Bus body
  ctx.fillStyle = bus.color;
  ctx.fillRect(-length, -width, length * 2, width * 2);
  
  // Roof
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(-length * 0.8, -width * 0.7, length * 1.4, width * 0.9);
  
  // Windows
  ctx.fillStyle = 'rgba(191, 219, 254, 0.8)';
  for (let i = 0; i < 4; i++) {
    const wx = -length * 0.7 + i * length * 0.45;
    ctx.fillRect(wx, -width * 0.55, length * 0.25, width * 1.1);
  }
  
  // Rear
  ctx.fillStyle = '#111827';
  ctx.fillRect(-length * 0.95, -width * 0.9, length * 0.1, width * 1.8);
  
  // Lights
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(length * 0.85, -width * 0.35, length * 0.1, width * 0.7);
  
  ctx.restore();
}

// Draw emergency vehicle with flashing lights
export function drawEmergencyVehicle(
  ctx: CanvasRenderingContext2D,
  vehicle: EmergencyVehicle,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(vehicle.tileX, vehicle.tileY, offsetX, offsetY);
  const centerX = screenX + TILE_WIDTH / 2;
  const centerY = screenY + TILE_HEIGHT / 2;
  const meta = DIRECTION_META[vehicle.direction];
  
  const vehicleX = centerX + meta.vec.dx * vehicle.progress + meta.normal.nx * vehicle.laneOffset;
  const vehicleY = centerY + meta.vec.dy * vehicle.progress + meta.normal.ny * vehicle.laneOffset;
  
  ctx.save();
  ctx.translate(vehicleX, vehicleY);
  ctx.rotate(meta.angle);
  
  const scale = 0.6;
  const bodyColor = vehicle.type === 'fire_truck' ? '#dc2626' : 
                   vehicle.type === 'police_car' ? '#1e40af' : '#ffffff';
  
  const length = vehicle.type === 'fire_truck' ? 14 : 11;
  
  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-length * scale, -5 * scale);
  ctx.lineTo(length * scale, -5 * scale);
  ctx.lineTo((length + 2) * scale, 0);
  ctx.lineTo(length * scale, 5 * scale);
  ctx.lineTo(-length * scale, 5 * scale);
  ctx.closePath();
  ctx.fill();
  
  // Stripe
  ctx.fillStyle = vehicle.type === 'fire_truck' ? '#fbbf24' : '#ffffff';
  ctx.fillRect(-length * scale * 0.5, -3 * scale, length * scale, 6 * scale * 0.3);
  
  // Windshield
  ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
  ctx.fillRect(-2 * scale, -3 * scale, 5 * scale, 6 * scale);
  
  // Flashing lights
  const flashOn = Math.sin(vehicle.flashTimer) > 0;
  const flashOn2 = Math.sin(vehicle.flashTimer + Math.PI) > 0;
  
  if (vehicle.type === 'fire_truck') {
    ctx.fillStyle = flashOn ? '#ff0000' : '#880000';
    ctx.fillRect(-6 * scale, -7 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = flashOn2 ? '#ff0000' : '#880000';
    ctx.fillRect(3 * scale, -7 * scale, 3 * scale, 3 * scale);
  } else if (vehicle.type === 'police_car') {
    ctx.fillStyle = flashOn ? '#ff0000' : '#880000';
    ctx.fillRect(-5 * scale, -7 * scale, 3 * scale, 3 * scale);
    ctx.fillStyle = flashOn2 ? '#0066ff' : '#003388';
    ctx.fillRect(2 * scale, -7 * scale, 3 * scale, 3 * scale);
  } else {
    // Ambulance
    ctx.fillStyle = flashOn ? '#ff0000' : '#880000';
    ctx.fillRect(-4 * scale, -7 * scale, 2 * scale, 2 * scale);
    ctx.fillStyle = flashOn2 ? '#ff0000' : '#880000';
    ctx.fillRect(2 * scale, -7 * scale, 2 * scale, 2 * scale);
  }
  
  // Glow effect when flashing
  if (flashOn || flashOn2) {
    ctx.shadowColor = flashOn ? '#ff0000' : '#0066ff';
    ctx.shadowBlur = 6;
    ctx.fillStyle = flashOn ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 100, 255, 0.4)';
    ctx.fillRect(-7 * scale, -8 * scale, 14 * scale, 4 * scale);
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}

// Draw a train with carriages
export function drawTrain(
  ctx: CanvasRenderingContext2D,
  train: Train,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  // Draw carriages first (behind locomotive)
  for (let i = train.carriages.length - 1; i >= 0; i--) {
    const carriage = train.carriages[i];
    drawTrainCarriage(ctx, carriage.tileX, carriage.tileY, carriage.progress, train.direction, train.color, offsetX, offsetY, zoom);
  }
  
  // Draw locomotive
  drawLocomotive(ctx, train.tileX, train.tileY, train.progress, train.direction, train.color, offsetX, offsetY, zoom);
}

function drawLocomotive(
  ctx: CanvasRenderingContext2D,
  tileX: number,
  tileY: number,
  progress: number,
  direction: CarDirection,
  color: string,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(tileX, tileY, offsetX, offsetY);
  const centerX = screenX + TILE_WIDTH / 2;
  const centerY = screenY + TILE_HEIGHT / 2;
  const meta = DIRECTION_META[direction];
  
  const trainX = centerX + meta.vec.dx * progress;
  const trainY = centerY + meta.vec.dy * progress;
  
  ctx.save();
  ctx.translate(trainX, trainY);
  ctx.rotate(meta.angle);
  
  const scale = 0.7;
  
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(-15 * scale, -6 * scale, 30 * scale, 12 * scale);
  
  // Cab
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(8 * scale, -7 * scale, 8 * scale, 14 * scale);
  
  // Windows
  ctx.fillStyle = 'rgba(191, 219, 254, 0.8)';
  ctx.fillRect(10 * scale, -5 * scale, 4 * scale, 6 * scale);
  
  // Front light
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(-14 * scale, 0, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawTrainCarriage(
  ctx: CanvasRenderingContext2D,
  tileX: number,
  tileY: number,
  progress: number,
  direction: CarDirection,
  color: string,
  offsetX: number,
  offsetY: number,
  zoom: number
) {
  const { screenX, screenY } = gridToScreen(tileX, tileY, offsetX, offsetY);
  const centerX = screenX + TILE_WIDTH / 2;
  const centerY = screenY + TILE_HEIGHT / 2;
  const meta = DIRECTION_META[direction];
  
  const carriageX = centerX + meta.vec.dx * progress;
  const carriageY = centerY + meta.vec.dy * progress;
  
  ctx.save();
  ctx.translate(carriageX, carriageY);
  ctx.rotate(meta.angle);
  
  const scale = 0.65;
  
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(-12 * scale, -5 * scale, 24 * scale, 10 * scale);
  
  // Windows
  ctx.fillStyle = 'rgba(191, 219, 254, 0.6)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-8 * scale + i * 7 * scale, -3 * scale, 5 * scale, 6 * scale);
  }
  
  ctx.restore();
}
