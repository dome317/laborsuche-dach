/**
 * Default map configuration constants
 */

import type { MapConfig } from '@/types/map';

/**
 * Default map configuration
 * Center: Indonesia coordinates
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  defaultCenter: [48.5, 10.5],  // DACH region center
  defaultZoom: 6,
  minZoom: 3,
  maxZoom: 18,
  zoomControl: false,
  attributionControl: true,
};

/**
 * Map animation duration in milliseconds
 */
export const MAP_ANIMATION_DURATION = 500;

/**
 * Default map container height
 */
export const DEFAULT_MAP_HEIGHT = '100vh';
