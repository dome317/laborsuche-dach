"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import Fuse from "fuse.js";
import type { Provider, ProviderCategory, ProvidersData } from "@/types/provider";

type CategoryFilter = ProviderCategory | "all";

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface ProviderContextValue {
  providers: Provider[];
  filteredProviders: Provider[];
  viewportProviders: Provider[];
  selectedCategory: CategoryFilter;
  setSelectedCategory: (cat: CategoryFilter) => void;
  selectedProviderId: string | null;
  setSelectedProviderId: (id: string | null) => void;
  selectedProvider: Provider | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryCounts: Record<CategoryFilter, number>;
  viewportCategoryCounts: Record<CategoryFilter, number>;
  isLoading: boolean;
  setViewportBounds: (bounds: ViewportBounds | null) => void;
  hoveredProviderId: string | null;
  setHoveredProviderId: (id: string | null) => void;
  userPosition: { lat: number; lng: number } | null;
  setUserPosition: (pos: { lat: number; lng: number } | null) => void;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function useProviders() {
  const ctx = useContext(ProviderContext);
  if (!ctx) throw new Error("useProviders must be used within ProviderProvider");
  return ctx;
}

/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMainCategory(provider: Provider): ProviderCategory {
  if (provider.categories.includes("both")) return "both";
  if (provider.categories.includes("dexa_body_composition"))
    return "dexa_body_composition";
  return "blutlabor";
}

// Read initial state from URL params
function getInitialParams(): {
  category: CategoryFilter;
  selected: string | null;
  search: string;
} {
  if (typeof window === "undefined")
    return { category: "all", selected: null, search: "" };

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") as CategoryFilter | null;
  const validCategories: CategoryFilter[] = [
    "all",
    "dexa_body_composition",
    "blutlabor",
    "both",
  ];
  return {
    category: category && validCategories.includes(category) ? category : "all",
    selected: params.get("selected"),
    search: params.get("q") || "",
  };
}

export function ProviderProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initial = useMemo(() => getInitialParams(), []);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    initial.category
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    initial.selected
  );
  const [searchQuery, setSearchQuery] = useState(initial.search);
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null);
  const [hoveredProviderId, setHoveredProviderId] = useState<string | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Load providers
  useEffect(() => {
    fetch("/data/providers.json")
      .then((r) => r.json())
      .then((data: ProvidersData) => {
        setProviders(data.providers);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load providers:", err);
        setIsLoading(false);
      });
  }, []);

  // Fuse.js index
  const fuse = useMemo(() => {
    if (providers.length === 0) return null;
    return new Fuse(providers, {
      keys: ["name", "address.city", "address.postalCode"],
      threshold: 0.4,
    });
  }, [providers]);

  // Category counts (before search filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: providers.length,
      dexa_body_composition: 0,
      blutlabor: 0,
      both: 0,
    };
    providers.forEach((p) => {
      const cat = getMainCategory(p);
      counts[cat]++;
    });
    return counts;
  }, [providers]);

  // Filtered providers
  const filteredProviders = useMemo(() => {
    let result = providers;

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => getMainCategory(p) === selectedCategory
      );
    }

    // Search filter
    if (searchQuery.trim() && fuse) {
      const searchResults = fuse.search(searchQuery.trim());
      const searchIds = new Set(searchResults.map((r) => r.item.id));
      result = result.filter((p) => searchIds.has(p.id));
    }

    return result;
  }, [providers, selectedCategory, searchQuery, fuse]);

  // Viewport-filtered providers (only those visible on map), sorted by distance if location known
  const viewportProviders = useMemo(() => {
    let result = filteredProviders;
    if (viewportBounds) {
      result = result.filter((p) => {
        const [lng, lat] = p.location.coordinates;
        return (
          lat >= viewportBounds.south &&
          lat <= viewportBounds.north &&
          lng >= viewportBounds.west &&
          lng <= viewportBounds.east
        );
      });
    }

    // Sort by distance when user position is known
    if (userPosition) {
      result = [...result].sort((a, b) => {
        const [aLng, aLat] = a.location.coordinates;
        const [bLng, bLat] = b.location.coordinates;
        const distA = haversineKm(userPosition.lat, userPosition.lng, aLat, aLng);
        const distB = haversineKm(userPosition.lat, userPosition.lng, bLat, bLng);
        return distA - distB;
      });
    }

    return result;
  }, [filteredProviders, viewportBounds, userPosition]);

  // Viewport category counts (for filter chips)
  const viewportCategoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: viewportProviders.length,
      dexa_body_composition: 0,
      blutlabor: 0,
      both: 0,
    };
    viewportProviders.forEach((p) => {
      const cat = getMainCategory(p);
      counts[cat]++;
    });
    return counts;
  }, [viewportProviders]);

  // Selected provider
  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) ?? null,
    [providers, selectedProviderId]
  );

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedProviderId) params.set("selected", selectedProviderId);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    const newUrl =
      params.toString() === ""
        ? window.location.pathname
        : `${window.location.pathname}?${params.toString()}`;

    window.history.replaceState(null, "", newUrl);
  }, [selectedCategory, selectedProviderId, searchQuery]);

  const value = useMemo<ProviderContextValue>(
    () => ({
      providers,
      filteredProviders,
      viewportProviders,
      selectedCategory,
      setSelectedCategory,
      selectedProviderId,
      setSelectedProviderId,
      selectedProvider,
      searchQuery,
      setSearchQuery,
      categoryCounts,
      viewportCategoryCounts,
      isLoading,
      setViewportBounds,
      hoveredProviderId,
      setHoveredProviderId,
      userPosition,
      setUserPosition,
    }),
    [
      providers,
      filteredProviders,
      viewportProviders,
      selectedCategory,
      selectedProviderId,
      selectedProvider,
      searchQuery,
      categoryCounts,
      viewportCategoryCounts,
      isLoading,
      hoveredProviderId,
      userPosition,
    ]
  );

  return (
    <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>
  );
}
