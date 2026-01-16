// Re-export from the new rendering engine for backward compatibility
export {
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_DEPTH,
} from './rendering/constants';

export {
  gridToScreen,
  screenToGrid,
  shadeColor,
  getRarityBonus,
  isRoadTile,
  getDirectionOptions,
  findPathOnRoads,
} from './rendering/utils';

export type { Point, IsoPoint } from './rendering/utils';

export {
  drawTile,
  drawGrassTile,
  drawWaterTile,
  drawHighlightedTile,
  drawBuilding,
  drawGrid,
  drawBuildings,
  isValidPlacement,
} from './rendering/drawing';
