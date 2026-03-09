/**
 * Component prop type definitions
 */

import type { ReactNode } from 'react';

/**
 * LeafletMap component props
 */
export interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  children?: ReactNode;
  onClick?: (lat: number, lng: number) => void;
  onMouseMove?: (lat: number, lng: number) => void;
  cursorStyle?: string;
}

/**
 * LeafletTileLayer component props
 */
export interface LeafletTileLayerProps {
  url: string;
  attribution?: string;
  maxZoom?: number;
  subdomains?: string[];
}

/**
 * DockContainer component props
 */
export interface DockContainerProps {
  children: ReactNode;
  position?: 'bottom' | 'top';
  className?: string;
}

/**
 * DockButton component props
 */
export interface DockButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

/**
 * Base map option for chooser
 */
export interface BaseMapOption {
  id: string;
  name: string;
  url: string;
  attribution: string;
  preview?: string;
}

/**
 * BaseMapChooser component props
 */
export interface BaseMapChooserProps {
  options: BaseMapOption[];
  activeId: string;
  onChange: (id: string) => void;
}
