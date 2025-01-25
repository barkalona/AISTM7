export default function MangaLoading({ fullScreen = false, text = 'Loading...' }) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'}`}>
      {/* Loading animation container */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
        
        {/* Spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
        
        {/* Energy particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-500 rounded-full animate-pulse-fast"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 30}deg) translateY(-36px)`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0.3 + (i % 3) * 0.2
            }}
          />
        ))}

        {/* Center circle with manga-style effects */}
        <div className="absolute inset-4 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="w-8 h-8 relative">
            {/* Manga-style speed lines */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border border-blue-500/20"
                style={{
                  transform: `rotate(${i * 45}deg) scale(${1 + i * 0.1})`,
                  animation: `expandOut 1s ease-out infinite ${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Loading text with manga-style speech bubble */}
      <div className="mt-8 relative">
        <div className="relative bg-white px-6 py-2 rounded-lg border-2 border-blue-500/20">
          <p className="text-lg font-mono bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {text}
          </p>
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blue-500" />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-blue-500" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-blue-500" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blue-500" />
        </div>
        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-blue-500/20 transform rotate-45" />
      </div>

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5" />
      </div>

      <style jsx>{`
        @keyframes expandOut {
          0% {
            transform: rotate(var(--rotation)) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: rotate(var(--rotation)) scale(1.2);
            opacity: 0.5;
          }
          100% {
            transform: rotate(var(--rotation)) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}