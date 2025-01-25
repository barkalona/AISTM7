import Image from 'next/image';
import FeatureCard from './FeatureCard';

export default function TrustSection() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="tech-circuit opacity-20" />
        <div className="data-grid opacity-10" />
        
        {/* Anime-style decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px]">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-full animate-pulse-slow" />
          <div className="absolute inset-0 border border-blue-500/10 rounded-full animate-spin-slow" />
          <div className="absolute inset-[10%] border border-yellow-500/10 rounded-full animate-spin-reverse" />
        </div>
      </div>

      {/* Content container */}
      <div className="max-w-7xl mx-auto text-center relative">
        {/* Section title with metallic effect */}
        <div className="relative inline-block mb-12">
          <h3 className="text-3xl font-bold font-mono bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent animate-in">
            Trusted by Professional Traders
          </h3>
          <div className="absolute -inset-x-6 -inset-y-2">
            <div className="w-full h-full bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 animate-shine" />
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Bank-Grade Security */}
          <div className="relative">
            <FeatureCard
              icon="/icons/security.svg"
              title="Bank-Grade Security"
              description="Enterprise-level encryption and security protocols"
            />
            {/* Decorative circuit lines */}
            <div className="absolute -right-4 top-1/2 w-8 h-px bg-gradient-to-r from-blue-500/30 to-transparent md:block hidden" />
          </div>

          {/* Regulatory Compliance */}
          <div className="relative">
            <FeatureCard
              icon="/icons/compliance.svg"
              title="Regulatory Compliance"
              description="Full compliance with financial regulations"
            />
            {/* Decorative circuit lines */}
            <div className="absolute -right-4 top-1/2 w-8 h-px bg-gradient-to-r from-blue-500/30 to-transparent md:block hidden" />
          </div>

          {/* 24/7 Support */}
          <FeatureCard
            icon="/icons/support.svg"
            title="24/7 Support"
            description="Round-the-clock expert assistance"
          />
        </div>

        {/* Anime-style decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px">
          <div className="h-full bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
            <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-ping" />
            <div className="absolute inset-[25%] bg-blue-500/30 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-blue-500/20" />
        <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-yellow-500/20" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-blue-500/20" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-yellow-500/20" />
      </div>

      {/* Metallic shine effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/10 via-transparent to-yellow-50/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
    </section>
  );
}