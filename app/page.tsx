import Image from "next/image";
import { Hero } from "@/components/landing/Hero";
import { NavigationButtons } from "@/components/landing/NavigationButtons";

/**
 * Landing page component (Server Component)
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e8ecf4]">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-map-dach.webp"
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
      </main>
    </div>
  );
}
