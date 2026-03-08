"use client";

import { useMemo } from "react";
import { LeafletMap } from "./LeafletMap";
import { LeafletTileLayer } from "./LeafletTileLayer";
import { MapTopBar } from "./MapTopBar";
import { MapTileSwitcher } from "./MapTileSwitcher";
import { MapControls } from "./MapControls";
import { ProviderSidebar } from "./ProviderSidebar";
import { useMapTileProvider } from "@/hooks/useMapTileProvider";
import { useProviderMarkers } from "@/hooks/useProviderMarkers";

export function MapMain() {
  const { tileProvider, currentProviderId, setProviderId } =
    useMapTileProvider();

  // Load provider markers onto the map (uses ProviderContext)
  useProviderMarkers();

  const tileLayerProps = useMemo(
    () => ({
      url: tileProvider.url,
      attribution: tileProvider.attribution,
      maxZoom: tileProvider.maxZoom,
    }),
    [tileProvider.url, tileProvider.attribution, tileProvider.maxZoom]
  );

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <LeafletMap className="w-full h-full">
        <LeafletTileLayer
          url={tileLayerProps.url}
          attribution={tileLayerProps.attribution}
          maxZoom={tileLayerProps.maxZoom}
        />
      </LeafletMap>

      {/* Provider Sidebar (desktop: left panel, mobile: bottom drawer) */}
      <ProviderSidebar />

      {/* Top Bar */}
      <MapTopBar />

      {/* Tile Switcher */}
      <MapTileSwitcher
        selectedProviderId={currentProviderId}
        onProviderChange={setProviderId}
      />

      {/* Map Controls */}
      <MapControls />
    </div>
  );
}
