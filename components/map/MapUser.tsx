"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";

/**
 * MapUser - Branding dropdown with navigation
 */
export function MapUser() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();

  const handleCloseMaps = () => {
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
            L
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[1100]">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Laborsuche DACH</p>
            <p className="text-xs leading-none text-muted-foreground">
              DEXA & Blutlabor Finder
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={toggleTheme}
          className="sm:hidden"
          disabled={!mounted}
        >
          {mounted && theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleCloseMaps}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Karte schließen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
