"use client";

export default function SplashScreen({ message = "Loading your workspace..." }) {
  return (
    <div className="min-h-screen bg-[#121118] flex flex-col items-center justify-center font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] rounded-full bg-[#7c5dfa]/10 blur-[100px] -top-12 -left-12 pointer-events-none"></div>
      <div className="absolute w-[300px] h-[300px] rounded-full bg-[#7c5dfa]/10 blur-[120px] -bottom-12 -right-12 pointer-events-none"></div>

      <div className="flex flex-col items-center z-10">
        <div className="relative mb-6 animate-pulse">
          <div className="absolute inset-0 bg-[#7c5dfa]/20 rounded-full blur-xl transform scale-125"></div>
          <svg
            className="w-16 h-16 text-[#7c5dfa] relative"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"
              fill="currentColor"
              fillOpacity="0.15"
            />
          </svg>
        </div>

        <h1 className="text-white text-xl font-bold tracking-[0.25em] uppercase pl-1.5 mb-1.5">
          MYCHATBOX
        </h1>
        <p className="text-white/40 text-[10px] tracking-widest uppercase font-medium">
          {message}
        </p>

        <div className="w-6 h-6 border-2 border-[#7c5dfa]/25 border-t-[#7c5dfa] rounded-full animate-spin mt-7"></div>
      </div>
    </div>
  );
}
