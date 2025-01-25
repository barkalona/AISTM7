"use client";

import React, { useState, useEffect } from 'react';

const testimonials = [
  {
    quote: "The AI analysis is like having a team of elite agents working for you. Incredible insights!",
    author: "Agent K.",
    role: "Crypto Specialist",
    avatar: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" className="fill-blue-400/10" />
        <path
          d="M24 28C24 26 28 24 32 24C36 24 40 26 40 28"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <circle cx="28" cy="28" r="2" className="fill-blue-400" />
        <circle cx="36" cy="28" r="2" className="fill-blue-400" />
        <path
          d="M28 36C30 38 34 38 36 36"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <path
          d="M20 20C20 16 28 12 32 12C36 12 44 16 44 20"
          className="stroke-blue-400"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    )
  },
  {
    quote: "My portfolio's performance has gone stealth mode since using this platform. Top secret stuff!",
    author: "Agent S.",
    role: "Risk Analyst",
    avatar: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" className="fill-blue-400/10" />
        <path
          d="M24 28C24 26 28 24 32 24C36 24 40 26 40 28"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <circle cx="28" cy="28" r="2" className="fill-blue-400" />
        <circle cx="36" cy="28" r="2" className="fill-blue-400" />
        <path
          d="M28 34C30 38 34 38 36 34"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <path
          d="M24 16L32 12L40 16"
          className="stroke-blue-400"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    )
  },
  {
    quote: "The real-time monitoring is like having x-ray vision into the market. Mission accomplished!",
    author: "Agent X.",
    role: "Portfolio Manager",
    avatar: (
      <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" className="fill-blue-400/10" />
        <path
          d="M24 28C24 26 28 24 32 24C36 24 40 26 40 28"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <circle cx="28" cy="28" r="2" className="fill-blue-400" />
        <circle cx="36" cy="28" r="2" className="fill-blue-400" />
        <path
          d="M28 36C30 34 34 34 36 36"
          className="stroke-blue-400"
          strokeWidth="2"
        />
        <path
          d="M20 18C20 14 32 10 44 18"
          className="stroke-blue-400"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    )
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
              Field Reports
            </h2>
          </div>
        </div>

        {/* Testimonials Slider */}
        <div className="relative">
          {/* Testimonial Cards */}
          <div className="flex justify-center">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute w-full max-w-2xl transition-all duration-500 ${
                  index === currentIndex
                    ? "opacity-100 translate-x-0"
                    : index < currentIndex
                    ? "opacity-0 -translate-x-full"
                    : "opacity-0 translate-x-full"
                }`}
              >
                {/* Card Content */}
                <div className="glass-card p-8 rounded-lg bg-white/5 backdrop-blur-sm">
                  {/* Quote */}
                  <div className="manga-bubble bg-white/10 backdrop-blur-sm p-6 mb-8 relative">
                    <p className="text-xl text-blue-200/80 italic">
                      "{testimonial.quote}"
                    </p>
                    {/* Tech Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                      <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {testimonial.avatar}
                      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-200">
                        {testimonial.author}
                      </h4>
                      <p className="text-blue-200/60">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 glass-card rounded-full animate-float bg-white/5">
                    <div className="absolute inset-0 holographic rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-blue-400"
                    : "bg-blue-400/20 hover:bg-blue-400/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}