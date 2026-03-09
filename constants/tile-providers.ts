/**
 * Tile provider configuration
 * Single German-language tile layer for DACH region
 */

import type { TileProvider } from '@/types/map';

export const TILE_PROVIDER: TileProvider = {
  id: 'osm-de',
  name: 'OpenStreetMap DE',
  url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Mitwirkende',
  maxZoom: 19,
  category: 'standard',
};
