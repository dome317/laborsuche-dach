"use client";

import { useState, useEffect } from "react";
import {
  Search,
  ArrowLeft,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Navigation,
  Share2,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { Drawer } from "vaul";
import { useProviders } from "@/contexts/ProviderContext";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getMainCategory,
} from "@/hooks/useProviderMarkers";
import type { Provider, ProviderCategory } from "@/types/provider";

type CategoryFilter = ProviderCategory | "all";

const FILTER_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "dexa_body_composition", label: "DEXA Body Scan" },
  { key: "blutlabor", label: "Blutlabor" },
  { key: "both", label: "Beides" },
];

// --- Filter Chips ---
function FilterChips() {
  const { selectedCategory, setSelectedCategory, categoryCounts } =
    useProviders();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {FILTER_OPTIONS.map(({ key, label }) => {
        const isActive = selectedCategory === key;
        const count = categoryCounts[key];
        const color =
          key === "all" ? "#6B7280" : CATEGORY_COLORS[key as ProviderCategory];

        return (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isActive
                ? "text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            style={
              isActive
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
          >
            {label} ({count})
          </button>
        );
      })}
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
        placeholder="Suche nach Name, Stadt, PLZ..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
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

// --- Provider Card ---
function ProviderCard({
  provider,
  onSelect,
}: {
  provider: Provider;
  onSelect: () => void;
}) {
  const category = getMainCategory(provider);
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  const lowestPrice = provider.services.reduce<number | null>((min, s) => {
    if (!s.price?.amount) return min;
    return min === null ? s.price.amount : Math.min(min, s.price.amount);
  }, null);

  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {provider.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {provider.address.city}
          </p>
        </div>
        {lowestPrice !== null && (
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
            ab {lowestPrice} €
          </span>
        )}
      </div>
      <div className="mt-1.5">
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

// --- Provider List ---
function ProviderList() {
  const { filteredProviders, setSelectedProviderId } = useProviders();

  if (filteredProviders.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Keine Anbieter gefunden.
      </div>
    );
  }

  return (
    <div>
      {filteredProviders.map((provider) => (
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
  const { selectedProvider, setSelectedProviderId } = useProviders();
  if (!selectedProvider) return null;

  const provider = selectedProvider;
  const category = getMainCategory(provider);
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const [lng, lat] = provider.location.coordinates;

  const isVerified = provider.verification.status === "verified";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const shareText = encodeURIComponent(
    `Schau mal: ${provider.name} – ${provider.contact.website}`
  );
  const whatsappUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="flex flex-col h-full">
      {/* Back button */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <button
          onClick={() => setSelectedProviderId(null)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Zurück zur Liste"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Zurück zur Liste
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {provider.name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isVerified
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              }`}
            >
              {isVerified ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {isVerified ? "Verifiziert" : "Nicht verifiziert"}
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

        {/* Services */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Leistungen
          </h3>
          <div className="space-y-2">
            {provider.services.map((service, i) => (
              <div
                key={i}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {service.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">
                    {service.price?.amount
                      ? `${service.price.amount} ${service.price.currency}`
                      : "Auf Anfrage"}
                  </span>
                </div>
                {service.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {service.description}
                  </p>
                )}
                {service.price?.note && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                    {service.price.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {provider.contact.phone && (
            <a
              href={`tel:${provider.contact.phone}`}
              className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {provider.contact.phone}
            </a>
          )}
          <a
            href={provider.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Globe className="h-4 w-4 flex-shrink-0" />
            Website
          </a>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {provider.contact.bookingUrl && (
            <a
              href={provider.contact.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: color }}
            >
              <Calendar className="h-4 w-4" />
              Termin buchen
            </a>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Navigation className="h-4 w-4" />
            Route planen
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
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
  const snapPoints = [0.35, 0.65, 1];
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const listView = (
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

  const content = selectedProvider ? <ProviderDetail /> : listView;

  if (isMobile) {
    return (
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
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
            <Drawer.Title className="sr-only">Anbieter</Drawer.Title>
            <div className="flex-1 overflow-hidden">{content}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop sidebar
  return (
    <div className="absolute top-0 left-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl z-[1000] flex flex-col">
      {content}
    </div>
  );
}
