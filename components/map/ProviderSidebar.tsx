"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  ArrowLeft,
  Phone,
  MapPin,
  Navigation,
  Share2,
  CheckCircle,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
  Calendar,
  Droplet,
} from "lucide-react";
import { Drawer } from "vaul";
import { useProviders, haversineKm } from "@/contexts/ProviderContext";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getMainCategory,
} from "@/hooks/useProviderMarkers";
import type { CategoryFilter } from "@/contexts/ProviderContext";
import type { Provider } from "@/types/provider";
import { BodyScanIcon } from "@/components/icons/BodyScanIcon";

const FILTER_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "dexa_body_composition", label: "DEXA Body Scan" },
  { key: "blutlabor", label: "Blutlabor" },
];

// Category icon helper
function CategoryIcon({ category, size = 14 }: { category: string; size?: number }) {
  if (category === "blutlabor") {
    return <Droplet className="flex-shrink-0" style={{ width: size, height: size }} />;
  }
  return <BodyScanIcon className="flex-shrink-0" size={size} />;
}

// --- Filter Chips ---
function FilterChips({ compact = false }: { compact?: boolean }) {
  const { selectedCategory, setSelectedCategory, viewportCategoryCounts: categoryCounts } =
    useProviders();

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-none ${compact ? "px-1" : ""}`}>
      {FILTER_OPTIONS.map(({ key, label }) => {
        const isActive = selectedCategory === key;
        const count = categoryCounts[key];
        const color =
          key === "all" ? "#6B7280" : CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS];

        return (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex-shrink-0 px-3 min-h-[44px] rounded-full text-xs font-medium transition-all border ${
              isActive
                ? "text-white shadow-sm"
                : "bg-slate-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            style={
              isActive
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
          >
            {`${label} (${count})`}
          </button>
        );
      })}
    </div>
  );
}

// --- Mobile Filter Bar (above the map) ---
function MobileFilterBar() {
  const { searchQuery, setSearchQuery } = useProviders();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[1050] p-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm safe-area-top">
      <div className="flex items-center gap-2">
        {searchOpen ? (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Ort, Anbieter oder PLZ suchen"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 min-h-[44px] text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                if (!searchQuery) setSearchQuery("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-x-auto">
              <FilterChips compact />
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/90 dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-sm"
            >
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- Search Input ---
function SearchInput() {
  const { searchQuery, setSearchQuery } = useProviders();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Ort, Anbieter oder PLZ suchen"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-8 py-2 min-h-[44px] text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}

// --- Loading Skeletons ---
function LoadingSkeletons() {
  return (
    <div className="px-4 py-3 space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-100 dark:bg-gray-800 animate-pulse rounded-xl h-24" />
      ))}
    </div>
  );
}

// --- Provider Card ---
function ProviderCard({
  provider,
  onSelect,
}: {
  provider: Provider;
  onSelect: () => void;
}) {
  const { hoveredProviderId, setHoveredProviderId, userPosition } = useProviders();
  const category = getMainCategory(provider);
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const isHovered = hoveredProviderId === provider.id;

  const cheapest = provider.services.reduce<{ amount: number; currency: string } | null>((min, s) => {
    if (!s.price?.amount) return min;
    if (min === null || s.price.amount < min.amount) {
      return { amount: s.price.amount, currency: s.price.currency };
    }
    return min;
  }, null);

  const distance = userPosition
    ? haversineKm(
        userPosition.lat,
        userPosition.lng,
        provider.location.coordinates[1],
        provider.location.coordinates[0]
      )
    : null;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHoveredProviderId(provider.id)}
      onMouseLeave={() => setHoveredProviderId(null)}
      className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
        isHovered
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      {/* Row 1: Category badge + Name */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          <CategoryIcon category={category} size={10} />
          {label}
        </span>
        <h3 className="text-sm font-medium text-slate-700 dark:text-white truncate">
          {provider.name}
        </h3>
      </div>
      {/* Row 2: City + Distance */}
      <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
        {provider.address.city}
        {distance !== null && (
          <span className="ml-1.5 text-blue-600 dark:text-blue-400">
            · {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1).replace(".", ",")} km`} entfernt
          </span>
        )}
      </p>
      {/* Row 3: Price */}
      {cheapest !== null ? (
        <p className="text-sm font-semibold text-amber-600 mt-0.5">
          ab {cheapest.amount} {cheapest.currency === "CHF" ? "CHF" : "€"}
        </p>
      ) : (
        <p className="text-sm text-slate-400 mt-0.5">Preis auf Anfrage</p>
      )}
    </button>
  );
}

// --- Result Count ---
function ResultCount() {
  const { viewportProviders } = useProviders();
  return (
    <p className="px-4 py-1.5 text-xs text-slate-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
      {viewportProviders.length} Anbieter im Kartenausschnitt
    </p>
  );
}

// --- Provider List ---
function ProviderList() {
  const {
    viewportProviders: visibleProviders,
    filteredProviders,
    selectedCategory,
    setSelectedProviderId,
    setSelectedCategory,
    isLoading,
  } = useProviders();

  if (isLoading) {
    return <LoadingSkeletons />;
  }

  if (filteredProviders.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-3xl mb-3">🔍</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Keine Anbieter für diesen Filter gefunden
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Versuche einen anderen Filter oder Suchbegriff.
        </p>
        {selectedCategory !== "all" && (
          <button
            onClick={() => setSelectedCategory("all")}
            className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Alle Anbieter anzeigen
          </button>
        )}
      </div>
    );
  }

  if (visibleProviders.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-3xl mb-3">🗺️</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Keine Anbieter im Kartenausschnitt
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Zoome heraus oder verschiebe die Karte.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ResultCount />
      {visibleProviders.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          onSelect={() => setSelectedProviderId(provider.id)}
        />
      ))}
    </div>
  );
}

// --- Provider Detail ---
function ProviderDetail() {
  const { selectedProvider, setSelectedProviderId, userPosition } = useProviders();
  if (!selectedProvider) return null;

  const provider = selectedProvider;
  const category = getMainCategory(provider);
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const [lng, lat] = provider.location.coordinates;

  const isVerified = provider.verified;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // Distance
  const distance = userPosition
    ? haversineKm(userPosition.lat, userPosition.lng, lat, lng)
    : null;

  // Cheapest price
  const cheapest = provider.services.reduce<{ amount: number; currency: string } | null>((min, s) => {
    if (!s.price?.amount) return min;
    if (min === null || s.price.amount < min.amount) {
      return { amount: s.price.amount, currency: s.price.currency };
    }
    return min;
  }, null);

  // WhatsApp share
  const shareLines = [
    provider.name,
    `📍 ${provider.address.city}${distance ? ` (${distance.toFixed(1)} km entfernt)` : ""}`,
    cheapest ? `💰 ab ${cheapest.amount} ${cheapest.currency === "CHF" ? "CHF" : "€"}` : "",
    `🔗 ${provider.contact.website || provider.contact.bookingUrl || ""}`,
  ].filter(Boolean);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareLines.join("\n"))}`;

  // Verification info
  const verifiedService = provider.services.find((s) => s.verification.status === "verified");

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <button
        onClick={() => setSelectedProviderId(null)}
        className="w-full px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        aria-label="Zurück zur Liste"
      >
        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Zurück zur Liste
        </span>
      </button>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Header: Above the fold */}
        <div className="px-4 pt-4 pb-3">
          {/* 1. Category Badge + Name */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              <CategoryIcon category={category} size={12} />
              {label}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-white">
            {provider.name}
          </h2>

          {/* 2. Distance + City */}
          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{provider.address.city}</span>
            {distance !== null && (
              <span className="text-blue-600 dark:text-blue-400">
                · {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1).replace(".", ",")} km`}
              </span>
            )}
          </div>

          {/* 3. Price */}
          <div className="mt-2">
            {cheapest ? (
              <span className="text-xl font-semibold text-amber-600">
                ab {cheapest.amount} {cheapest.currency === "CHF" ? "CHF" : "€"}
              </span>
            ) : (
              <span className="text-base text-slate-400">Preis auf Anfrage</span>
            )}
          </div>

          {/* 4. Verified Badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isVerified
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              }`}
            >
              {isVerified ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {isVerified ? "Verifiziert" : "Nicht verifiziert"}
              {isVerified && verifiedService?.verification.date && (
                <span className="text-[10px] ml-1 opacity-75">
                  ({verifiedService.verification.date})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p>{provider.address.street}</p>
              <p>
                {provider.address.postalCode} {provider.address.city}
              </p>
              <p>{provider.address.state}, {provider.address.country}</p>
            </div>
          </div>
        </div>

        {/* Services as Tags/Pills */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-2">
            Leistungen
          </h3>
          <div className="flex flex-wrap gap-2">
            {provider.services.map((service, i) => {
              const svcVerified = service.verification.status === "verified";
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-gray-800 text-xs px-3 py-1 text-slate-700 dark:text-gray-300">
                    {service.name}
                    {service.price?.amount && (
                      <span className="font-semibold text-amber-600 ml-1">
                        {service.price.amount} {service.price.currency === "CHF" ? "CHF" : "€"}
                      </span>
                    )}
                    {svcVerified && (
                      <CheckCircle className="h-3 w-3 text-emerald-500 ml-0.5" />
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky CTA Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {/* Verification trust box */}
          {isVerified && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>
                Daten verifiziert
                {verifiedService?.verification.method && (
                  <> via {verifiedService.verification.method}</>
                )}
              </span>
            </div>
          )}

          {/* Button Grid */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Navigation className="h-4 w-4" />
              Route planen
            </a>
            {provider.contact.bookingUrl ? (
              <a
                href={provider.contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Termin buchen
              </a>
            ) : provider.contact.phone ? (
              <a
                href={`tel:${provider.contact.phone}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Anrufen
              </a>
            ) : null}
          </div>

          {/* Website button */}
          {provider.contact.website && (
            <a
              href={provider.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Website öffnen
            </a>
          )}

          {/* WhatsApp share */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Per WhatsApp teilen
          </a>
        </div>
      </div>
    </div>
  );
}

// --- Main Sidebar ---
export function ProviderSidebar() {
  const { selectedProvider, setSelectedProviderId } = useProviders();
  const [isMobile, setIsMobile] = useState(false);
  const snapPoints = [0.5, 0.65, 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const desktopListView = (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 space-y-3 border-b border-gray-100 dark:border-gray-800">
        <SearchInput />
        <FilterChips />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ProviderList />
      </div>
    </div>
  );

  const mobileListView = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ProviderList />
      </div>
    </div>
  );

  if (isMobile) {
    const mobileContent = selectedProvider ? <ProviderDetail /> : mobileListView;

    return (
      <>
        <MobileFilterBar />

        <Drawer.Root
          open
          snapPoints={snapPoints}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
          modal={false}
          noBodyStyles
          dismissible={false}
        >
          <Drawer.Portal>
            <Drawer.Content
              className="fixed flex flex-col bg-white dark:bg-gray-900 rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] !z-[1100] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]"
              aria-describedby={undefined}
            >
              {/* Bigger drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-gray-600" />
              </div>
              <Drawer.Title className="sr-only">Anbieter</Drawer.Title>
              <div className="flex-1 overflow-hidden">{mobileContent}</div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </>
    );
  }

  const content = selectedProvider ? <ProviderDetail /> : desktopListView;
  return (
    <div className="absolute top-0 left-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-[1000] flex flex-col">
      {content}
    </div>
  );
}
