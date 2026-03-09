"use client";

import { memo } from "react";
import { MapThemeSwitcher } from "./MapThemeSwitcher";
import { MapUser } from "./MapUser";

/**
 * MapTopBar - Top navigation bar with theme switcher and user menu
 */
export const MapTopBar = memo(function MapTopBar() {
  return (
    <div className="absolute right-4 top-4 flex items-center gap-2 z-[1000]">
      <div className="hidden sm:flex items-center gap-2">
        <MapThemeSwitcher />
        <MapUser />
      </div>
    </div>
  );
});

MapTopBar.displayName = "MapTopBar";
