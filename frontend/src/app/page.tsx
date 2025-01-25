import clsx from 'clsx';
import BlockchainVisualization from '@/components/BlockchainVisualization';
import HolographicCard from '@/components/HolographicCard';
import MangaCharacter from '@/components/MangaCharacter';

const mockPortfolioData = [
  { id: 1, title: 'Bitcoin', value: '3.25 BTC', change: '+2.5%' },
  { id: 2, title: 'Ethereum', value: '15.7 ETH', change: '+1.8%' },
  { id: 3, title: 'Cardano', value: '2,500 ADA', change: '-0.3%' },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a0b0f] text-white overflow-hidden">
      {/* Blockchain Visualization Background */}
      <BlockchainVisualization
        className="absolute inset-0 z-0"
        nodeColor="#59CBE8"
        connectionColor="#59CBE8"
        nodeCount={100}
        animationSpeed={1.2}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0b0f]/50 to-[#0a0b0f] z-10 pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-20">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#59CBE8] animate-pulse" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] bg-clip-text text-transparent">
            AISTM7
          </h1>
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] rounded-lg text-[#0a0b0f] font-semibold shadow-lg hover:shadow-[#59CBE8]/20 transition-all duration-300 hover:scale-105">
          Connect Wallet
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center min-h-screen z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#59CBE8] to-[#2D88FF] bg-clip-text text-transparent">
              Blockchain
            </span>
            <br />
            <span className="text-white">
              Portfolio Analysis
            </span>
          </h1>
          <p className="text-lg text-[#59CBE8]/80 max-w-2xl mx-auto">
            Level up your trading game with AI-powered insights and real-time market analysis.
            Join the future of blockchain trading.
          </p>
        </div>

        {/* Character and Cards */}
        <div className="relative">
          {/* Manga Character */}
          <MangaCharacter className="mb-8" glowColor="#59CBE8" interactive />

          {/* Holographic Cards */}
          <div className="absolute -right-64 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
            {mockPortfolioData.map((data, index) => (
              <HolographicCard
                key={data.id}
                glowIntensity="high"
                interactive
                delay={index * 0.2}
                className="w-48"
              >
                <div className="p-4">
                  <h2 className="text-lg font-bold text-[#59CBE8]">{data.title}</h2>
                  <p className="text-xl mt-1">{data.value}</p>
                  <p className={clsx(
                    'text-sm mt-1',
                    data.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                  )}>
                    {data.change}
                  </p>
                </div>
              </HolographicCard>
            ))}
          </div>
        </div>
      </main>

      {/* Status Indicators */}
      <div className="fixed top-1/4 right-8 hidden lg:block">
        <HolographicCard glowIntensity="medium" className="p-4">
          <div className="text-sm font-mono text-[#59CBE8]">
            <div className="opacity-60">System Status</div>
            <div className="font-bold animate-pulse">OPERATIONAL</div>
          </div>
        </HolographicCard>
      </div>

      <div className="fixed bottom-8 left-8 hidden lg:block">
        <HolographicCard glowIntensity="medium" className="p-4">
          <div className="text-sm font-mono text-[#59CBE8]">
            <div className="opacity-60">Network</div>
            <div className="font-bold animate-pulse">SECURE</div>
          </div>
        </HolographicCard>
      </div>

      {/* Tech Lines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#59CBE8]/20 to-transparent" />
        <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-transparent via-[#59CBE8]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#59CBE8]/20 to-transparent" />
      </div>
    </div>
  );
}
