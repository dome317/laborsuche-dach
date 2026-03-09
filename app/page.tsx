import Image from "next/image";
import { Hero } from "@/components/landing/Hero";
import { NavigationButtons } from "@/components/landing/NavigationButtons";
import { TechStack } from "@/components/landing/TechStack";

/**
 * Landing page component (Server Component)
 *
 * Following Next.js 16 best practices:
 * - Server Component by default for better performance
 * - Only child components that need interactivity are Client Components
 * - Image optimization with Next.js Image component
 * - Optimized for dark background with light text
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e8ecf4]">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-map-dach.png"
          alt="DACH-Karte mit Laborstandorten"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Main content */}
      <main className="relative flex flex-col items-center justify-center min-h-screen">
        {/* Hero section */}
        <section className="w-full">
          <Hero />
        </section>

        {/* Navigation buttons */}
        <section className="w-full py-8">
          <NavigationButtons />
        </section>

        {/* Tech stack */}
        <section className="w-full py-8">
          <TechStack />
        </section>
      </main>
    </div>
  );
}
