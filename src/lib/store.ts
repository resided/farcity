import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  PlacedBuilding, Boost, GameState, Tile, TileBuilding, ZoneType, 
  Stats, Budget, Tool, Notification, HistoryPoint
} from './types';
import { getBuildingById, BUILDINGS } from './buildings';

// Generate UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create initial tile
function createTile(x: number, y: number): Tile {
  return {
    x,
    y,
    type: 'grass',
    zone: 'none',
    building: {
      type: 'grass',
      level: 0,
      population: 0,
      jobs: 0,
      constructionProgress: 100,
      onFire: false,
      abandoned: false,
    },
    hasSubway: false,
    landValue: 50,
    pollution: 0,
    crime: 0,
  };
}

// Create initial grid
function createGrid(size: number): Tile[][] {
  const grid: Tile[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      row.push(createTile(x, y));
    }
    grid.push(row);
  }
  return grid;
}

// Create service grid
function createServiceGrid<T>(size: number, defaultValue: T): T[][] {
  const grid: T[][] = [];
  for (let y = 0; y < size; y++) {
    grid.push(new Array(size).fill(defaultValue));
  }
  return grid;
}

// Initial stats
const initialStats: Stats = {
  population: 0,
  jobs: 0,
  money: 10000,
  income: 0,
  expenses: 0,
  happiness: 50,
  health: 50,
  education: 50,
  safety: 50,
  environment: 50,
  demand: {
    residential: 50,
    commercial: 50,
    industrial: 50,
  },
};

// Initial budget
const initialBudget: Budget = {
  police: { name: 'Police', funding: 100, cost: 0 },
  fire: { name: 'Fire', funding: 100, cost: 0 },
  health: { name: 'Health', funding: 100, cost: 0 },
  education: { name: 'Education', funding: 100, cost: 0 },
  transportation: { name: 'Transportation', funding: 100, cost: 0 },
  parks: { name: 'Parks', funding: 100, cost: 0 },
  power: { name: 'Power', funding: 100, cost: 0 },
  water: { name: 'Water', funding: 100, cost: 0 },
};

const GRID_SIZE = 30;

interface GameStore extends GameState {
  // Actions
  addCast: (amount: number) => void;
  spendCast: (amount: number) => boolean;
  addPremium: (amount: number) => void;
  spendPremium: (amount: number) => boolean;
  addXp: (amount: number) => void;
  placeBuilding: (buildingId: string, x: number, y: number) => boolean;
  removeBuilding: (id: string) => void;
  upgradeBuilding: (id: string) => boolean;
  selectBuilding: (id: string | null) => void;
  collectIncome: () => number;
  activateBoost: (boost: Boost) => void;
  setShowShop: (show: boolean) => void;
  setShowInventory: (show: boolean) => void;
  setShopTab: (tab: 'buildings' | 'currency' | 'boosts' | 'premium') => void;
  setBuildingCategory: (category: string) => void;
  calculateIncome: () => number;
  calculateBoostMultiplier: () => number;
  
  // City building actions
  setTool: (tool: Tool) => void;
  setSpeed: (speed: 0 | 1 | 2 | 3) => void;
  placeAtTile: (x: number, y: number) => void;
  setZone: (x: number, y: number, zone: ZoneType) => void;
  bulldoze: (x: number, y: number) => void;
  setTaxRate: (rate: number) => void;
  setBudgetFunding: (key: keyof Budget, funding: number) => void;
  setActivePanel: (panel: GameState['activePanel']) => void;
  addNotification: (title: string, description: string, icon: string) => void;
  
  // Simulation
  simulateTick: () => void;
  
  // Save/Load
  newGame: (name?: string, size?: number) => void;
  loadState: (state: Partial<GameState>) => void;
  exportState: () => string;
  reset: () => void;
}

const XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.5;

const createInitialState = (): GameState => ({
  id: generateUUID(),
  cityName: 'New City',
  cast: 10000,
  premium: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: XP_PER_LEVEL,
  grid: createGrid(GRID_SIZE),
  gridSize: GRID_SIZE,
  buildings: [],
  selectedBuilding: null,
  selectedTool: 'select',
  activePanel: 'none',
  speed: 1,
  year: 2025,
  month: 1,
  day: 1,
  hour: 8,
  stats: initialStats,
  budget: initialBudget,
  taxRate: 9,
  effectiveTaxRate: 9,
  services: {
    power: createServiceGrid(GRID_SIZE, false),
    water: createServiceGrid(GRID_SIZE, false),
    fire: createServiceGrid(GRID_SIZE, 0),
    police: createServiceGrid(GRID_SIZE, 0),
    health: createServiceGrid(GRID_SIZE, 0),
    education: createServiceGrid(GRID_SIZE, 0),
  },
  activeBoosts: [],
  showShop: false,
  showInventory: false,
  shopTab: 'buildings',
  buildingCategory: 'all',
  totalEarned: 0,
  totalSpent: 0,
  buildingsPlaced: 0,
  lastSaved: Date.now(),
  lastCollected: Date.now(),
  disastersEnabled: false,
  history: [],
  notifications: [],
  gameVersion: 0,
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      
      addCast: (amount) => set((state) => ({ 
        cast: state.cast + amount,
        totalEarned: state.totalEarned + amount 
      })),
      
      spendCast: (amount) => {
        const state = get();
        if (state.cast >= amount) {
          set({ 
            cast: state.cast - amount,
            totalSpent: state.totalSpent + amount 
          });
          return true;
        }
        return false;
      },
      
      addPremium: (amount) => set((state) => ({ premium: state.premium + amount })),
      
      spendPremium: (amount) => {
        const state = get();
        if (state.premium >= amount) {
          set({ premium: state.premium - amount });
          return true;
        }
        return false;
      },
      
      addXp: (amount) => {
        const state = get();
        let newXp = state.xp + amount;
        let newLevel = state.level;
        let xpNeeded = state.xpToNextLevel;
        
        while (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel++;
          xpNeeded = Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, newLevel - 1));
        }
        
        set({
          xp: newXp,
          level: newLevel,
          xpToNextLevel: xpNeeded,
        });
      },
      
      placeBuilding: (buildingId, x, y) => {
        const state = get();
        const building = getBuildingById(buildingId);
        
        if (!building) return false;
        if (building.unlockLevel > state.level) return false;
        if (!state.spendCast(building.price)) return false;
        
        const newBuilding: PlacedBuilding = {
          id: `${buildingId}-${Date.now()}`,
          buildingId,
          x,
          y,
          level: 1,
          lastCollected: Date.now(),
          boosted: false,
        };
        
        set({
          buildings: [...state.buildings, newBuilding],
          buildingsPlaced: state.buildingsPlaced + 1,
          selectedBuilding: null,
        });
        
        get().addXp(Math.floor(building.price / 10));
        return true;
      },
      
      removeBuilding: (id) => set((state) => ({
        buildings: state.buildings.filter(b => b.id !== id),
      })),
      
      upgradeBuilding: (id) => {
        const state = get();
        const placedBuilding = state.buildings.find(b => b.id === id);
        if (!placedBuilding) return false;
        
        const building = getBuildingById(placedBuilding.buildingId);
        if (!building) return false;
        
        const upgradeCost = Math.floor(building.price * placedBuilding.level * 0.5);
        if (!state.spendCast(upgradeCost)) return false;
        
        set({
          buildings: state.buildings.map(b =>
            b.id === id ? { ...b, level: b.level + 1 } : b
          ),
        });
        
        get().addXp(Math.floor(upgradeCost / 10));
        return true;
      },
      
      selectBuilding: (id) => set({ selectedBuilding: id }),
      
      collectIncome: () => {
        const state = get();
        const now = Date.now();
        const hoursPassed = Math.min((now - state.lastCollected) / (1000 * 60 * 60), 24);
        
        if (hoursPassed < 0.001) return 0;
        
        let totalIncome = 0;
        const boostMultiplier = state.calculateBoostMultiplier();
        
        for (const placed of state.buildings) {
          const building = getBuildingById(placed.buildingId);
          if (!building) continue;
          
          const baseIncome = building.income * placed.level;
          const boostedIncome = baseIncome * boostMultiplier;
          totalIncome += Math.floor(boostedIncome * hoursPassed);
        }
        
        if (totalIncome > 0) {
          set({
            cast: state.cast + totalIncome,
            totalEarned: state.totalEarned + totalIncome,
            lastCollected: now,
          });
        }
        
        return totalIncome;
      },
      
      activateBoost: (boost) => {
        const state = get();
        if (!state.spendCast(boost.price)) return;
        
        const activeBoost = {
          ...boost,
          active: true,
          expiresAt: Date.now() + boost.duration * 60 * 60 * 1000,
        };
        
        set({
          activeBoosts: [...state.activeBoosts.filter(b => b.id !== boost.id), activeBoost],
        });
      },
      
      setShowShop: (show) => set({ showShop: show }),
      setShowInventory: (show) => set({ showInventory: show }),
      setShopTab: (tab) => set({ shopTab: tab }),
      setBuildingCategory: (category) => set({ buildingCategory: category }),
      
      calculateIncome: () => {
        const state = get();
        let totalIncome = 0;
        
        for (const placed of state.buildings) {
          const building = getBuildingById(placed.buildingId);
          if (!building) continue;
          totalIncome += building.income * placed.level;
        }
        
        return totalIncome;
      },
      
      calculateBoostMultiplier: () => {
        const state = get();
        const now = Date.now();
        let multiplier = 1;
        
        for (const boost of state.activeBoosts) {
          if (boost.expiresAt && boost.expiresAt > now) {
            multiplier *= boost.multiplier;
          }
        }
        
        return multiplier;
      },
      
      // City building actions
      setTool: (tool) => set({ selectedTool: tool, activePanel: 'none', selectedBuilding: null }),
      
      setSpeed: (speed) => set({ speed }),
      
      placeAtTile: (x, y) => {
        const state = get();
        const tool = state.selectedTool;
        
        if (tool === 'select') return;
        if (x < 0 || y < 0 || x >= state.gridSize || y >= state.gridSize) return;
        
        const newGrid = [...state.grid.map(row => [...row])];
        const tile = newGrid[y][x];
        
        // Tool costs
        const toolCosts: Record<string, number> = {
          bulldoze: 10,
          road: 10,
          rail: 20,
          zone_residential: 5,
          zone_commercial: 5,
          zone_industrial: 5,
          zone_dezone: 0,
          park: 100,
          tree: 5,
          police_station: 500,
          fire_station: 500,
          hospital: 1000,
          school: 500,
          power_plant: 2000,
          water_tower: 500,
        };
        
        const cost = toolCosts[tool] || 0;
        
        // Check if we can afford it
        if (cost > 0 && state.stats.money < cost) return;
        
        let placed = false;
        
        switch (tool) {
          case 'road':
            if (tile.building.type !== 'water') {
              tile.type = 'road';
              tile.building = { ...tile.building, type: 'road' };
              tile.zone = 'none';
              placed = true;
            }
            break;
            
          case 'rail':
            if (tile.building.type !== 'water' && tile.building.type !== 'road') {
              tile.type = 'rail';
              tile.building = { ...tile.building, type: 'rail' };
              tile.zone = 'none';
              placed = true;
            }
            break;
            
          case 'park':
            if (tile.building.type === 'grass' || tile.building.type === 'empty') {
              tile.type = 'park';
              tile.building = { ...tile.building, type: 'park' };
              tile.zone = 'none';
              placed = true;
            }
            break;
            
          case 'tree':
            if (tile.building.type === 'grass' || tile.building.type === 'empty') {
              tile.type = 'tree';
              tile.building = { ...tile.building, type: 'tree' };
              placed = true;
            }
            break;
            
          case 'zone_residential':
          case 'zone_commercial':
          case 'zone_industrial': {
            const zone = tool.replace('zone_', '') as ZoneType;
            if (tile.building.type === 'grass' || tile.building.type === 'empty') {
              tile.zone = zone;
              placed = true;
            }
            break;
          }
            
          case 'zone_dezone':
            tile.zone = 'none';
            placed = true; // Always succeeds, no cost
            break;
            
          case 'bulldoze':
            // Can bulldoze anything except water
            if (tile.type !== 'water') {
              tile.type = 'grass';
              tile.building = createTile(x, y).building;
              tile.zone = 'none';
              placed = true;
            }
            break;
            
          case 'police_station':
          case 'fire_station':
          case 'hospital':
          case 'school':
          case 'power_plant':
          case 'water_tower':
            // Service buildings - check if tile is empty
            if (tile.building.type === 'grass' || tile.building.type === 'empty') {
              tile.type = 'building';
              tile.building = {
                ...tile.building,
                type: 'building',
                buildingId: tool,
                level: 1,
                constructionProgress: 100,
              };
              tile.zone = 'none';
              placed = true;
            }
            break;
        }
        
        // Deduct cost if placement succeeded
        if (placed && cost > 0) {
          set({
            grid: newGrid,
            stats: { ...state.stats, money: state.stats.money - cost },
          });
        } else if (placed) {
          set({ grid: newGrid });
        }
      },
      
      setZone: (x, y, zone) => {
        const state = get();
        const newGrid = [...state.grid.map(row => [...row])];
        newGrid[y][x].zone = zone;
        set({ grid: newGrid });
      },
      
      bulldoze: (x, y) => {
        const state = get();
        const newGrid = [...state.grid.map(row => [...row])];
        newGrid[y][x] = createTile(x, y);
        set({ grid: newGrid });
      },
      
      setTaxRate: (rate) => set({ taxRate: Math.max(0, Math.min(20, rate)) }),
      
      setBudgetFunding: (key, funding) => {
        const state = get();
        const clamped = Math.max(0, Math.min(100, funding));
        set({
          budget: {
            ...state.budget,
            [key]: { ...state.budget[key], funding: clamped },
          },
        });
      },
      
      setActivePanel: (panel) => set({ activePanel: panel }),
      
      addNotification: (title, description, icon) => {
        const state = get();
        const notification: Notification = {
          id: `${Date.now()}-${Math.random()}`,
          title,
          description,
          icon,
          timestamp: Date.now(),
        };
        
        set({
          notifications: [notification, ...state.notifications].slice(0, 10),
        });
      },
      
      // Simulation tick
      simulateTick: () => {
        const state = get();
        
        // Advance time
        let { hour, day, month, year } = state;
        hour++;
        if (hour >= 24) {
          hour = 0;
          day++;
          if (day > 30) {
            day = 1;
            month++;
            if (month > 12) {
              month = 1;
              year++;
            }
          }
        }
        
        // Simple population/job growth based on zoning
        const newGrid = [...state.grid.map(row => [...row])];
        let totalPop = 0;
        let totalJobs = 0;
        
        for (let y = 0; y < state.gridSize; y++) {
          for (let x = 0; x < state.gridSize; x++) {
            const tile = newGrid[y][x];
            
            // Grow zoned areas that have road access
            if (tile.zone !== 'none' && tile.building.type === 'grass') {
              const hasRoadAccess = [
                newGrid[y - 1]?.[x],
                newGrid[y + 1]?.[x],
                newGrid[y]?.[x - 1],
                newGrid[y]?.[x + 1],
              ].some(t => t?.building?.type === 'road');
              
              if (hasRoadAccess && Math.random() < 0.1) {
                tile.type = 'building';
                tile.building = {
                  ...tile.building,
                  type: 'building',
                  constructionProgress: 0,
                };
              }
            }
            
            // Progress construction
            if (tile.building.type === 'building' && tile.building.constructionProgress < 100) {
              tile.building.constructionProgress = Math.min(100, tile.building.constructionProgress + 10);
            }
            
            // Grow population/jobs for completed buildings
            if (tile.building.type === 'building' && tile.building.constructionProgress >= 100) {
              const maxPop = tile.zone === 'residential' ? 10 : 0;
              const maxJobs = tile.zone === 'commercial' ? 5 : tile.zone === 'industrial' ? 10 : 0;
              
              if (tile.building.population < maxPop) {
                tile.building.population = Math.min(maxPop, tile.building.population + 1);
              }
              if (tile.building.jobs < maxJobs) {
                tile.building.jobs = Math.min(maxJobs, tile.building.jobs + 1);
              }
            }
            
            totalPop += tile.building.population;
            totalJobs += tile.building.jobs;
          }
        }
        
        // Calculate income/expenses
        const income = Math.floor(totalPop * state.taxRate * 0.1);
        const expenses = Object.values(state.budget).reduce((sum, b) => sum + b.cost, 0);
        
        // Monthly updates
        let newMoney = state.stats.money;
        if (day === 1 && hour === 0) {
          newMoney += income - expenses;
          
          // Record history
          const historyPoint: HistoryPoint = {
            year,
            month,
            population: totalPop,
            money: newMoney,
            happiness: state.stats.happiness,
          };
          
          set({
            history: [...state.history, historyPoint].slice(-100),
          });
        }
        
        set({
          grid: newGrid,
          hour,
          day,
          month,
          year,
          stats: {
            ...state.stats,
            population: totalPop,
            jobs: totalJobs,
            money: newMoney,
            income,
            expenses,
          },
        });
      },
      
      newGame: (name = 'New City', size = GRID_SIZE) => {
        set({
          ...createInitialState(),
          cityName: name,
          gridSize: size,
          grid: createGrid(size),
          services: {
            power: createServiceGrid(size, false),
            water: createServiceGrid(size, false),
            fire: createServiceGrid(size, 0),
            police: createServiceGrid(size, 0),
            health: createServiceGrid(size, 0),
            education: createServiceGrid(size, 0),
          },
          gameVersion: get().gameVersion + 1,
        });
      },
      
      loadState: (state) => {
        set({
          ...state,
          gameVersion: get().gameVersion + 1,
        });
      },
      
      exportState: () => {
        const state = get();
        return JSON.stringify({
          id: state.id,
          cityName: state.cityName,
          grid: state.grid,
          gridSize: state.gridSize,
          stats: state.stats,
          budget: state.budget,
          taxRate: state.taxRate,
          year: state.year,
          month: state.month,
          day: state.day,
          hour: state.hour,
          history: state.history,
        });
      },
      
      reset: () => set(createInitialState()),
    }),
    {
      name: 'claudity-game',
      partialize: (state) => ({
        id: state.id,
        cityName: state.cityName,
        cast: state.cast,
        premium: state.premium,
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        grid: state.grid,
        gridSize: state.gridSize,
        buildings: state.buildings,
        stats: state.stats,
        budget: state.budget,
        taxRate: state.taxRate,
        effectiveTaxRate: state.effectiveTaxRate,
        year: state.year,
        month: state.month,
        day: state.day,
        hour: state.hour,
        totalEarned: state.totalEarned,
        totalSpent: state.totalSpent,
        buildingsPlaced: state.buildingsPlaced,
        history: state.history,
        gameVersion: state.gameVersion,
      }),
    }
  )
);

// Helper to get available buildings for current level
export const getAvailableBuildings = (level: number) => {
  return BUILDINGS.filter(b => b.unlockLevel <= level);
};

// Helper to get locked buildings
export const getLockedBuildings = (level: number) => {
  return BUILDINGS.filter(b => b.unlockLevel > level);
};
