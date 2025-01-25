import ModernHero from '../src/components/ModernHero';
import HowItWorks from '../src/components/HowItWorks';
import Testimonials from '../src/components/Testimonials';
import ModernNav from '../src/components/ModernNav';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <ModernNav />
      <ModernHero />
      <HowItWorks />
      <Testimonials />
    </main>
  );
}