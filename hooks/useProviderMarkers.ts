"use client";

import { useEffect, useRef, useState } from "react";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { useProviders } from "@/contexts/ProviderContext";
import type { Provider } from "@/types/provider";
import type { Marker, MarkerClusterGroup } from "leaflet";

/** Visual category for marker rendering — derived from categories array */
export type MarkerCategory = "dexa_body_composition" | "knochendichte" | "blutlabor";

export const CATEGORY_COLORS: Record<MarkerCategory, string> = {
  dexa_body_composition: "#7C3AED", // Violet
  knochendichte: "#2563EB",         // Blue
  blutlabor: "#DC2626",             // Warm-Red
};

export const CATEGORY_LABELS: Record<MarkerCategory, string> = {
  dexa_body_composition: "DEXA Body Scan",
  knochendichte: "Knochendichte",
  blutlabor: "Blutlabor",
};

function createMarkerIcon(category: MarkerCategory, selected: boolean): string {
  const color = CATEGORY_COLORS[category];

  let iconSvg = "";
  if (category === "dexa_body_composition") {
    // Body silhouette
    iconSvg = `<circle cx="12" cy="4" r="2" fill="white"/><line x1="12" y1="6" x2="12" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="9" x2="16" y2="9" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="9" y2="20" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="15" x2="15" y2="20" stroke="white" stroke-width="2" stroke-linecap="round"/>`;
  } else if (category === "knochendichte") {
    // Bone icon (simplified)
    iconSvg = `<path d="M18 6c0-1.7-1.3-3-3-3s-3 1.3-3 3c0 .7.3 1.4.7 1.9L11 10l-1.7-2.1c.4-.5.7-1.2.7-1.9 0-1.7-1.3-3-3-3S4 4.3 4 6c0 1 .5 1.9 1.2 2.4L4 18c0 1.7 1.3 3 3 3s3-1.3 3-3c0-.7-.3-1.4-.7-1.9L11 14l1.7 2.1c-.4.5-.7 1.2-.7 1.9 0 1.7 1.3 3 3 3s3-1.3 3-3c0-1-.5-1.9-1.2-2.4z" fill="white" stroke="none"/>`;
  } else {
    // Droplet
    iconSvg = `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="white"/>`;
  }

  const size = selected ? 40 : 32;
  const cx = size / 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${cx}" cy="${cx}" r="${cx}" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"/>
      <circle cx="${cx}" cy="${cx}" r="${cx - 3}" fill="${color}"/>
      <g transform="translate(${cx - 12},${cx - 12})">
        <svg viewBox="0 0 24 24" width="24" height="24">
          ${iconSvg}
        </svg>
      </g>
    </svg>
  `;
}

/** Derive visual marker category from provider's categories array (primary for display) */
export function getMainCategory(provider: Provider): MarkerCategory {
  if (provider.categories.includes("dexa_body_composition")) return "dexa_body_composition";
  if (provider.categories.includes("knochendichte")) return "knochendichte";
  return "blutlabor";
}

/** Determine majority category color for a cluster */
function getClusterColor(childMarkers: Marker[]): string {
  const counts: Record<MarkerCategory, number> = {
    dexa_body_composition: 0,
    knochendichte: 0,
    blutlabor: 0,
  };

  childMarkers.forEach((m) => {
    const cat = (m.options as { category?: MarkerCategory }).category;
    if (cat) counts[cat]++;
  });

  let maxCat: MarkerCategory = "dexa_body_composition";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat as MarkerCategory;
    }
  }

  return CATEGORY_COLORS[maxCat];
}

export function useProviderMarkers() {
  const map = useLeafletMap();
  const {
    filteredProviders,
    selectedProviderId,
    setSelectedProviderId,
    setViewportBounds,
    hoveredProviderId,
    setHoveredProviderId,
  } = useProviders();
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const clusterGroupRef = useRef<MarkerClusterGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const initialFitDoneRef = useRef(false);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load leaflet + markercluster once
  useEffect(() => {
    const win = window as unknown as Record<string, unknown>;
    // Reuse existing patched L if available (survives remount)
    if (win.L && typeof (win.L as Record<string, unknown>).markerClusterGroup === "function") {
      leafletRef.current = win.L as typeof import("leaflet");
      setLeafletReady(true);
      return;
    }
    import("leaflet").then(async (L) => {
      const mutableL = Object.create(L) as typeof L;
      win.L = mutableL;
      await import("leaflet.markercluster");
      leafletRef.current = mutableL;
      setLeafletReady(true);
    });
  }, []);

  // Render markers with clustering
  useEffect(() => {
    if (!map || !leafletRef.current) return;
    const L = leafletRef.current;

    // Create cluster group if needed
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster) => {
          const childMarkers = cluster.getAllChildMarkers();
          const count = cluster.getChildCount();
          const color = getClusterColor(childMarkers);

          const size = count < 10 ? 36 : count < 50 ? 44 : 52;

          return L.divIcon({
            html: `<div style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              background: ${color};
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${size < 40 ? "13" : "15"}px;
              font-family: sans-serif;
            ">${count}</div>`,
            className: "provider-cluster",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });
      map.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;

    // Remove old markers that are no longer in filtered set
    const filteredIds = new Set(filteredProviders.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!filteredIds.has(id)) {
        clusterGroup.removeLayer(marker);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    filteredProviders.forEach((provider) => {
      const [lng, lat] = provider.location.coordinates;
      const category = getMainCategory(provider);
      const isSelected = provider.id === selectedProviderId;
      const isHovered = provider.id === hoveredProviderId;
      const highlighted = isSelected || isHovered;

      const existing = markersRef.current.get(provider.id);
      if (existing) {
        const iconSvg = createMarkerIcon(category, highlighted);
        const size = highlighted ? 40 : 32;
        existing.setIcon(
          L.divIcon({
            html: iconSvg,
            className: `provider-marker${highlighted ? " provider-marker-active" : ""}`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })
        );
        existing.setZIndexOffset(isSelected ? 1000 : isHovered ? 500 : 0);
        return;
      }

      // Create new marker
      const iconSvg = createMarkerIcon(category, highlighted);
      const size = highlighted ? 40 : 32;
      const icon = L.divIcon({
        html: iconSvg,
        className: `provider-marker${highlighted ? " provider-marker-active" : ""}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([lat, lng], {
        icon,
        category,
      } as L.MarkerOptions & { category: MarkerCategory });
      marker.on("click", () => {
        setSelectedProviderId(provider.id);
      });
      marker.on("mouseover", () => {
        setHoveredProviderId(provider.id);
      });
      marker.on("mouseout", () => {
        setHoveredProviderId(null);
      });

      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      clusterGroup.addLayer(marker);
      markersRef.current.set(provider.id, marker);
    });
  }, [map, leafletReady, filteredProviders, selectedProviderId, setSelectedProviderId, hoveredProviderId, setHoveredProviderId]);

  // Fit bounds ONLY on initial load
  useEffect(() => {
    if (!map || filteredProviders.length === 0 || initialFitDoneRef.current) return;

    const bounds: [number, number][] = filteredProviders.map((p) => {
      const [lng, lat] = p.location.coordinates;
      return [lat, lng];
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as import("leaflet").LatLngBoundsExpression, {
        padding: [50, 50],
        maxZoom: 12,
      });
      initialFitDoneRef.current = true;
    }
  }, [map, filteredProviders]);

  // Fly to selected provider
  useEffect(() => {
    if (!map || !selectedProviderId) return;
    const provider = filteredProviders.find(
      (p) => p.id === selectedProviderId
    );
    if (!provider) return;

    const [lng, lat] = provider.location.coordinates;
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [map, selectedProviderId, filteredProviders]);

  // Track viewport bounds for sidebar filtering
  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const b = map.getBounds();
      setViewportBounds({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    updateBounds();

    map.on("moveend", updateBounds);
    map.on("zoomend", updateBounds);

    return () => {
      map.off("moveend", updateBounds);
      map.off("zoomend", updateBounds);
    };
  }, [map, setViewportBounds]);

  // Cleanup on unmount
  useEffect(() => {
    const markers = markersRef.current;
    const clusterGroup = clusterGroupRef.current;
    return () => {
      if (clusterGroup) {
        clusterGroup.clearLayers();
        clusterGroup.remove();
        clusterGroupRef.current = null;
      }
      markers.clear();
    };
  }, []);
}
