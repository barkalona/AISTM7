export default function AgentBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
      {/* Light theme background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/90 to-slate-100/80" />
      
      {/* Anime-style agent silhouette */}
      <svg
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 h-[140vh] w-[1200px]"
        viewBox="0 0 800 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main character */}
        <g className="animate-float">
          {/* Suit */}
          <path
            d="M400 200 C500 180 550 240 550 300
               L500 600 L450 550 L400 600 L350 550 L300 600
               L250 300 C250 240 300 180 400 200Z"
            fill="url(#metallic-suit)"
            className="filter drop-shadow-lg"
          />
          
          {/* Head */}
          <path
            d="M350 180 C350 140 450 140 450 180
               C450 220 350 220 350 180Z"
            fill="url(#metallic-head)"
          />

          {/* Tie */}
          <path
            d="M390 200 L400 250 L410 200 L400 190Z"
            fill="#2563EB"
            className="animate-pulse-slow"
          />

          {/* Glasses reflection */}
          <path
            d="M370 170 L380 170 M420 170 L430 170"
            stroke="white"
            strokeWidth="2"
            className="animate-pulse"
          />
        </g>

        {/* Tech analysis display */}
        <g className="animate-float-delayed">
          {/* Holographic circle */}
          <circle
            cx="600"
            cy="400"
            r="50"
            stroke="url(#holo-circle)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse-slow"
          />
          
          {/* Data lines */}
          <path
            d="M550 380 L650 380 M550 400 L650 400 M550 420 L650 420"
            stroke="url(#data-line)"
            strokeWidth="2"
            className="animate-pulse-fast"
          />
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="metallic-suit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="metallic-head" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="holo-circle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="data-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tech patterns */}
      <div className="absolute inset-0">
        <div className="tech-circuit opacity-10" />
        <div className="data-grid opacity-5" />
      </div>

      {/* Light overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/10 via-transparent to-blue-50/10" />
    </div>
  );
}