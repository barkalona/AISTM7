"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import WalletConnection from './WalletConnection';

export default function ModernNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-900/80 backdrop-blur-sm border-b border-blue-500/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Image
                src="/images/logo.svg"
                alt="AISTM7"
                width={32}
                height={32}
                className="w-8 h-8 transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-blue-500 rounded-full filter blur opacity-0 group-hover:opacity-30 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              AISTM7
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { href: '/features', label: 'Features' },
              { href: '/analysis', label: 'Analysis' },
              { href: '/portfolio', label: 'Portfolio' },
              { href: '/about', label: 'About' }
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative group text-blue-200/80 hover:text-blue-100 transition-colors"
              >
                <span>{label}</span>
                <div className="absolute -bottom-1 left-0 w-0 h-px bg-blue-400 transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <WalletConnection />
        </div>
      </div>

      {/* Tech Lines */}
      <div className="absolute bottom-0 left-0 w-full h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>
    </nav>
  );
}