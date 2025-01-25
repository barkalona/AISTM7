import Image from 'next/image';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="metallic-card group relative overflow-hidden rounded-lg p-6 transition-all duration-500 hover:-translate-y-2">
      {/* Metallic background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/90 to-slate-100/80 opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/30 via-transparent to-yellow-50/30" />
      
      {/* Content container */}
      <div className="relative z-10">
        {/* Icon with metallic effect */}
        <div className="relative mb-4 h-12 w-12 transform transition-transform duration-500 group-hover:scale-110">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-slate-200 via-white to-slate-200" />
          <div className="absolute inset-0 animate-glow rounded-lg" />
          <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
            <Image
              src={icon}
              alt={title}
              width={24}
              height={24}
              className="relative z-10 text-blue-600 transition-transform duration-500 group-hover:scale-110"
            />
            {/* Shine effect */}
            <div className="absolute inset-0 animate-shine rounded-lg opacity-0 group-hover:opacity-100" />
          </div>
        </div>

        {/* Title with gradient */}
        <h4 className="mb-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text font-mono text-xl font-semibold text-transparent">
          {title}
        </h4>

        {/* Description */}
        <p className="text-slate-600 transition-colors duration-500 group-hover:text-slate-800">
          {description}
        </p>

        {/* Decorative elements */}
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-yellow-500/30 to-blue-500/30 scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
        
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-blue-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-yellow-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-blue-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-yellow-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>

      {/* Hover effects */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        {/* Tech circuit pattern */}
        <div className="absolute inset-0 tech-circuit opacity-10" />
        
        {/* Metallic shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/20 via-transparent to-yellow-50/20" />
      </div>
    </div>
  );
}