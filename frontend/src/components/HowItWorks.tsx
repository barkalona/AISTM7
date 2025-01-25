"use client";

import React from 'react';
import Image from 'next/image';

const steps = [
  {
    title: "Connect Your Gadgets",
    description: "Link your wallet with military-grade security. Our spy-tech ensures your assets stay undercover.",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" className="fill-blue-400/10" />
        <path
          d="M18 24C18 20 21 16 24 16C27 16 30 20 30 24"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <path
          d="M16 24H32"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <circle cx="24" cy="24" r="2" className="fill-blue-400" />
      </svg>
    )
  },
  {
    title: "Deploy AI Agents",
    description: "Our elite AI agents analyze your portfolio with precision, identifying opportunities and threats.",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" className="fill-blue-400/10" />
        <path
          d="M20 28L24 24L28 28M24 24V32"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <path
          d="M18 20H30"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <circle cx="24" cy="18" r="2" className="fill-blue-400" />
      </svg>
    )
  },
  {
    title: "Execute Mission",
    description: "Take action with confidence using our strategic insights and real-time market intelligence.",
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" className="fill-blue-400/10" />
        <path
          d="M16 24L22 30L32 20"
          className="stroke-blue-400"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Digital Grid Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 modern-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5" />
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <div className="text-center mb-16">
          <div className="manga-bubble bg-white/10 backdrop-blur-sm inline-block">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              Mission Briefing
            </h2>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Step Card */}
              <div className="glass-card p-8 rounded-lg transition-transform duration-300 group-hover:scale-105 bg-white/5 backdrop-blur-sm">
                {/* Icon */}
                <div className="mb-6 relative">
                  {step.icon}
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-semibold text-blue-200 mb-4">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-blue-200/80">
                  {step.description}
                </p>

                {/* Tech Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                  <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
                </div>
              </div>

              {/* Connecting Lines */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-blue-500/20 transform -translate-y-1/2" />
              )}

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 glass-card rounded-full animate-float bg-white/5"
                   style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="absolute inset-0 holographic rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center mt-16">
          <button className="relative group inline-flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg">
              <span className="text-white font-semibold">Begin Training</span>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-px bg-white/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}