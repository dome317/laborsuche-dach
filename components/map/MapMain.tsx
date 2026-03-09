"use client";

import { LeafletMap } from "./LeafletMap";
import { LeafletTileLayer } from "./LeafletTileLayer";
import { MapTopBar } from "./MapTopBar";
import { MapControls } from "./MapControls";
import { ProviderSidebar } from "./ProviderSidebar";
import { useProviderMarkers } from "@/hooks/useProviderMarkers";
import { TILE_PROVIDER } from "@/constants/tile-providers";

export function MapMain() {
  // Load provider markers onto the map (uses ProviderContext)
  useProviderMarkers();

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <LeafletMap className="w-full h-full">
        <LeafletTileLayer
          url={TILE_PROVIDER.url}
          attribution={TILE_PROVIDER.attribution}
          maxZoom={TILE_PROVIDER.maxZoom}
        />
      </LeafletMap>

      {/* Provider Sidebar (desktop: left panel, mobile: bottom drawer) */}
      <ProviderSidebar />

      {/* Top Bar */}
      <MapTopBar />

      {/* Map Controls */}
      <MapControls />
    </div>
  );
}
