import { MapProvider } from "@/contexts/MapContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import { MapMain, MapErrorBoundary, MapLoadingSpinner } from "@/components/map";

export default function MapPage() {
  return (
    <div className="relative w-full h-screen">
      <MapErrorBoundary>
        <MapProvider>
          <ProviderProvider>
            <MapMain />
            <MapLoadingSpinner />
          </ProviderProvider>
        </MapProvider>
      </MapErrorBoundary>
    </div>
  );
}
