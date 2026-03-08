"use client";

import { useEffect, useRef } from "react";
import { useLeafletMap } from "@/hooks/useLeafletMap";
import type { Provider, ProviderCategory, ProvidersData } from "@/types/provider";
import type { Marker, LatLngBoundsExpression } from "leaflet";

const CATEGORY_COLORS: Record<ProviderCategory, string> = {
  dexa_body_composition: "#2563EB", // Blue
  blutlabor: "#10B981",             // Green
  both: "#8B5CF6",                  // Violet
};

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  dexa_body_composition: "DEXA",
  blutlabor: "Blut",
  both: "DEXA+Blut",
};

function createMarkerIcon(category: ProviderCategory): string {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const isDEXA = category === "dexa_body_composition" || category === "both";
  const isBlut = category === "blutlabor" || category === "both";

  // SVG icon — Activity for DEXA, Droplets for Blut
  let iconSvg = "";
  if (isDEXA && !isBlut) {
    // Activity icon (heart rate / body scan)
    iconSvg = `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  } else if (isBlut && !isDEXA) {
    // Droplets icon
    iconSvg = `<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" fill="white"/><path d="M12.56 14.69c1.34 0 2.44-1.12 2.44-2.48 0-.71-.35-1.38-1.05-1.95S12.78 9.06 12.56 8.3c-.18.89-.7 1.74-1.4 2.3s-1.04 1.24-1.04 1.96c0 1.36 1.1 2.13 2.44 2.13z" fill="white"/>`;
  } else {
    // Both — combined icon (star-like)
    iconSvg = `<path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/>
      </filter>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="12" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(6,6)">
        <svg viewBox="0 0 24 24" width="24" height="24">
          ${iconSvg}
        </svg>
      </g>
      <text x="18" y="44" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}" font-family="sans-serif">${label}</text>
    </svg>
  `;
}

function getMainCategory(provider: Provider): ProviderCategory {
  if (provider.categories.includes("both")) return "both";
  if (provider.categories.includes("dexa_body_composition")) return "dexa_body_composition";
  return "blutlabor";
}

function createPopupContent(provider: Provider): string {
  const category = getMainCategory(provider);
  const color = CATEGORY_COLORS[category];
  const services = provider.services
    .map((s) => {
      const price = s.price?.amount ? `${s.price.amount} ${s.price.currency}` : "Preis auf Anfrage";
      return `<div style="margin:4px 0"><strong>${s.name}</strong><br/><span style="color:#666">${price}</span></div>`;
    })
    .join("");

  return `
    <div style="min-width:200px;max-width:280px">
      <div style="font-size:14px;font-weight:bold;color:${color};margin-bottom:4px">${provider.name}</div>
      <div style="font-size:12px;color:#666;margin-bottom:8px">
        ${provider.address.street}, ${provider.address.postalCode} ${provider.address.city}
      </div>
      <div style="border-top:1px solid #eee;padding-top:6px;font-size:12px">
        ${services}
      </div>
      ${provider.contact.website ? `<div style="margin-top:6px"><a href="${provider.contact.website}" target="_blank" rel="noopener" style="color:${color};font-size:12px">Website &rarr;</a></div>` : ""}
    </div>
  `;
}

export function useProviderMarkers() {
  const map = useLeafletMap();
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    const loadProviders = async () => {
      try {
        const L = await import("leaflet");
        const response = await fetch("/data/providers.json");
        const data: ProvidersData = await response.json();

        if (!isMounted) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        const bounds: [number, number][] = [];

        data.providers.forEach((provider) => {
          const [lng, lat] = provider.location.coordinates; // GeoJSON is [lng, lat]
          const category = getMainCategory(provider);

          const iconSvg = createMarkerIcon(category);
          const icon = L.divIcon({
            html: iconSvg,
            className: "provider-marker",
            iconSize: [36, 48],
            iconAnchor: [18, 48],
            popupAnchor: [0, -48],
          });

          const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(createPopupContent(provider));

          markersRef.current.push(marker);
          bounds.push([lat, lng]);
        });

        // fitBounds so all markers are visible
        if (bounds.length > 0) {
          map.fitBounds(bounds as LatLngBoundsExpression, { padding: [50, 50] });
        }
      } catch (error) {
        console.error("Failed to load providers:", error);
      }
    };

    loadProviders();

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map]);
}
