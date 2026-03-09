/**
 * Hero component for landing page (Server Component)
 */
export function Hero() {
  return (
    <div className="relative flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24">
      {/* Content */}
      <div className="max-w-4xl mx-auto space-y-6 bg-white/70 backdrop-blur-md rounded-3xl px-8 py-10 shadow-lg">
        <h1 className="scroll-m-20 pb-2 text-4xl sm:text-7xl text-gray-900 font-extrabold tracking-tight first:mt-0 text-balance">
          Laborsuche DACH
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto">
          Finde DEXA Body Composition Scans, Knochendichtemessungen und Selbstzahler-Blutlabore in Deutschland, Österreich und der Schweiz.
        </p>
      </div>
    </div>
  );
}
