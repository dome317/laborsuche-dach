"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import { useProviders } from "@/contexts/ProviderContext";
import type { Provider, ProviderCategory } from "@/types/provider";
import type { Marker } from "leaflet";

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

export function useProviderMarkers() {
  const map = useLeafletMap();
  const {
    filteredProviders,
    selectedProviderId,
    setSelectedProviderId,
  } = useProviders();
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  // Load leaflet once
  useEffect(() => {
    import("leaflet").then((L) => {
      leafletRef.current = L;
    });
  }, []);

  // Render markers based on filtered providers
  useEffect(() => {
    if (!map || !leafletRef.current) return;
    const L = leafletRef.current;

    // Remove old markers that are no longer in filtered set
    const filteredIds = new Set(filteredProviders.map((p) => p.id));
    markersRef.current.forEach((marker, id) => {
      if (!filteredIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add/update markers
    filteredProviders.forEach((provider) => {
      const [lng, lat] = provider.location.coordinates;
      const category = getMainCategory(provider);
      const isSelected = provider.id === selectedProviderId;

      const existing = markersRef.current.get(provider.id);
      if (existing) {
        // Update icon for selection state
        const iconSvg = createMarkerIcon(category, isSelected);
        const size = isSelected ? 44 : 36;
        const height = isSelected ? 58 : 48;
        existing.setIcon(
          L.divIcon({
            html: iconSvg,
            className: "provider-marker",
            iconSize: [size, height],
            iconAnchor: [size / 2, height],
            popupAnchor: [0, -height],
          })
        );
        if (isSelected) {
          existing.setZIndexOffset(1000);
        } else {
          existing.setZIndexOffset(0);
        }
        return;
      }

      // Create new marker
      const iconSvg = createMarkerIcon(category, isSelected);
      const size = isSelected ? 44 : 36;
      const height = isSelected ? 58 : 48;
      const icon = L.divIcon({
        html: iconSvg,
        className: "provider-marker",
        iconSize: [size, height],
        iconAnchor: [size / 2, height],
        popupAnchor: [0, -height],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelectedProviderId(provider.id);
      });

      if (isSelected) {
        marker.setZIndexOffset(1000);
      }

      markersRef.current.set(provider.id, marker);
    });
  }, [map, filteredProviders, selectedProviderId, setSelectedProviderId]);

  // Fit bounds when filtered providers change (not on selection change)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
    };
  }, []);
}
