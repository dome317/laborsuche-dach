"use client";

import { useEffect, useRef } from "react";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { useProviders } from "@/contexts/ProviderContext";
import type { Provider, ProviderCategory } from "@/types/provider";
import type { Marker, MarkerClusterGroup } from "leaflet";

export const CATEGORY_COLORS: Record<ProviderCategory, string> = {
  dexa_body_composition: "#2563EB",
  blutlabor: "#10B981",
  both: "#8B5CF6",
};

export const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  dexa_body_composition: "DEXA Body Scan",
  blutlabor: "Blutlabor",
  both: "Beides",
};

const CATEGORY_LABELS_SHORT: Record<ProviderCategory, string> = {
  dexa_body_composition: "DEXA",
  blutlabor: "Blut",
  both: "DEXA+Blut",
};

function createMarkerIcon(category: ProviderCategory, selected: boolean): string {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS_SHORT[category];
  const isDEXA = category === "dexa_body_composition" || category === "both";
  const isBlut = category === "blutlabor" || category === "both";

  let iconSvg = "";
  if (isDEXA && !isBlut) {
    iconSvg = `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  } else if (isBlut && !isDEXA) {
    iconSvg = `<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" fill="white"/><path d="M12.56 14.69c1.34 0 2.44-1.12 2.44-2.48 0-.71-.35-1.38-1.05-1.95S12.78 9.06 12.56 8.3c-.18.89-.7 1.74-1.4 2.3s-1.04 1.24-1.04 1.96c0 1.36 1.1 2.13 2.44 2.13z" fill="white"/>`;
  } else {
    iconSvg = `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }

  const size = selected ? 44 : 36;
  const height = selected ? 58 : 48;
  const cx = size / 2;
  const shadowOpacity = selected ? "0.5" : "0.3";
  const strokeWidth = selected ? "3" : "2";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${height}" viewBox="0 0 ${size} ${height}">
      <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="${selected ? "2.5" : "1.5"}" flood-opacity="${shadowOpacity}"/>
      </filter>
      <path d="M${cx} 0C${cx * 0.447} 0 0 ${cx * 0.447} 0 ${cx}c0 ${cx * 0.75} ${cx} ${height - cx} ${cx} ${height - cx}s${cx}-${height - cx * 1.75} ${cx}-${height - cx}C${size} ${cx * 0.447} ${size - cx * 0.447} 0 ${cx} 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="${cx}" cy="${cx}" r="${cx * 0.667}" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
      <g transform="translate(${cx - 12},${cx - 12})">
        <svg viewBox="0 0 24 24" width="24" height="24">
          ${iconSvg}
        </svg>
      </g>
      <text x="${cx}" y="${height - 2}" text-anchor="middle" font-size="${selected ? "9" : "8"}" font-weight="bold" fill="${color}" font-family="sans-serif">${label}</text>
    </svg>
  `;
}

export function getMainCategory(provider: Provider): ProviderCategory {
  if (provider.categories.includes("both")) return "both";
  if (provider.categories.includes("dexa_body_composition"))
    return "dexa_body_composition";
  return "blutlabor";
}

/** Determine majority category color for a cluster */
function getClusterColor(childMarkers: Marker[]): string {
  const counts: Record<ProviderCategory, number> = {
    dexa_body_composition: 0,
    blutlabor: 0,
    both: 0,
  };

  childMarkers.forEach((m) => {
    const cat = (m.options as { category?: ProviderCategory }).category;
    if (cat) counts[cat]++;
  });

  let maxCat: ProviderCategory = "dexa_body_composition";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCat = cat as ProviderCategory;
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

  // Load leaflet + markercluster once (markercluster expects mutable global L)
  useEffect(() => {
    import("leaflet").then(async (L) => {
      // ES module namespace is frozen; markercluster needs a mutable L on window
      const mutableL = Object.create(L) as typeof L;
      (window as unknown as Record<string, unknown>).L = mutableL;
      await import("leaflet.markercluster");
      leafletRef.current = mutableL;
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

          // Size based on count
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
        // Update icon for selection/hover state
        const iconSvg = createMarkerIcon(category, highlighted);
        const size = highlighted ? 44 : 36;
        const height = highlighted ? 58 : 48;
        existing.setIcon(
          L.divIcon({
            html: iconSvg,
            className: `provider-marker${highlighted ? " provider-marker-active" : ""}`,
            iconSize: [size, height],
            iconAnchor: [size / 2, height],
            popupAnchor: [0, -height],
          })
        );
        existing.setZIndexOffset(isSelected ? 1000 : isHovered ? 500 : 0);
        return;
      }

      // Create new marker
      const iconSvg = createMarkerIcon(category, highlighted);
      const size = highlighted ? 44 : 36;
      const height = highlighted ? 58 : 48;
      const icon = L.divIcon({
        html: iconSvg,
        className: `provider-marker${highlighted ? " provider-marker-active" : ""}`,
        iconSize: [size, height],
        iconAnchor: [size / 2, height],
        popupAnchor: [0, -height],
      });

      const marker = L.marker([lat, lng], {
        icon,
        category, // Store category for cluster color calculation
      } as L.MarkerOptions & { category: ProviderCategory });
      marker.on("click", () => {
        setSelectedProviderId(provider.id);
      });
      // Bidirectional hover: marker → sidebar
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
  }, [map, filteredProviders, selectedProviderId, setSelectedProviderId, hoveredProviderId, setHoveredProviderId]);

  // Fit bounds when filtered providers change
  useEffect(() => {
    if (!map || filteredProviders.length === 0) return;

    const bounds: [number, number][] = filteredProviders.map((p) => {
      const [lng, lat] = p.location.coordinates;
      return [lat, lng];
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as import("leaflet").LatLngBoundsExpression, {
        padding: [50, 50],
        maxZoom: 12,
      });
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

    // Initial bounds
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
    return () => {
      if (clusterGroupRef.current) {
        clusterGroupRef.current.clearLayers();
        clusterGroupRef.current.remove();
        clusterGroupRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);
}
