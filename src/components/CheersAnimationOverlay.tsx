'use client';

import React, { useEffect } from 'react';
import { CheersTier } from '@/lib/audioEffects';
import { Crown, Sparkles, Flame, Skull, Users } from 'lucide-react';

export interface CheersData {
  id: string;
  tier: CheersTier;
  title: string;
  subtitle: string;
  totalSips: number;
  drinkers: Array<{
    name: string;
    sips: number;
    suit?: string;
  }>;
}

interface CheersAnimationOverlayProps {
  cheers: CheersData | null;
  onDismiss: () => void;
}

/**
 * Animated SVG Beer Mug component with rich frothy foam, bubbles, and glass reflections.
 */
function BeerMug({ isFlipped = false }: { isFlipped?: boolean }) {
  return (
    <div
      className={`relative w-20 h-24 sm:w-24 sm:h-28 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] ${
        isFlipped ? '-scale-x-100' : ''
      }`}
    >
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {/* Amber Beer Liquid Gradient */}
          <linearGradient id={`beerGrad_${isFlipped ? 'r' : 'l'}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Frothy White Cream Foam Gradient */}
          <linearGradient id={`foamGrad_${isFlipped ? 'r' : 'l'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>

          {/* Glass Highlight */}
          <linearGradient id={`glassGrad_${isFlipped ? 'r' : 'l'}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="80%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Mug Handle (Outside on the left) */}
        <path
          d="M 28 38 C 10 38 6 52 6 66 C 6 80 12 90 28 92"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 28 38 C 12 38 8 52 8 66 C 8 80 14 90 28 92"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />

        {/* Outer Heavy Glass Body */}
        <rect
          x="26"
          y="30"
          width="54"
          height="75"
          rx="8"
          fill={`url(#beerGrad_${isFlipped ? 'r' : 'l'})`}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="3"
        />

        {/* Bottom Glass Base Thickness */}
        <rect
          x="26"
          y="95"
          width="54"
          height="10"
          rx="5"
          fill="rgba(255, 255, 255, 0.3)"
          stroke="rgba(255, 255, 255, 0.6)"
          strokeWidth="1.5"
        />

        {/* Rising Carbonation Bubbles in Liquid */}
        <circle cx="38" cy="85" r="2" fill="#fff" opacity="0.6" className="animate-foam-rise" />
        <circle cx="52" cy="72" r="1.5" fill="#fff" opacity="0.5" className="animate-foam-rise" style={{ animationDelay: '0.4s' }} />
        <circle cx="66" cy="80" r="2.5" fill="#fff" opacity="0.7" className="animate-foam-rise" style={{ animationDelay: '0.8s' }} />
        <circle cx="45" cy="55" r="1.5" fill="#fff" opacity="0.6" className="animate-foam-rise" style={{ animationDelay: '0.2s' }} />
        <circle cx="60" cy="62" r="2" fill="#fff" opacity="0.6" className="animate-foam-rise" style={{ animationDelay: '0.6s' }} />

        {/* Vertical Glass Facets / Ribs */}
        <line x1="42" y1="36" x2="42" y2="92" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="3" strokeLinecap="round" />
        <line x1="53" y1="36" x2="53" y2="92" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="4" strokeLinecap="round" />
        <line x1="64" y1="36" x2="64" y2="92" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="3" strokeLinecap="round" />

        {/* Glass Surface Shimmer Overlay */}
        <rect
          x="26"
          y="30"
          width="54"
          height="75"
          rx="8"
          fill={`url(#glassGrad_${isFlipped ? 'r' : 'l'})`}
          pointerEvents="none"
        />

        {/* Frothy Foam Head Overflowing the Rim */}
        {/* Main Fluffy Clouds of Foam */}
        <path
          d="M 23 32 
             C 21 24, 30 18, 38 21 
             C 42 15, 52 14, 57 19 
             C 63 15, 73 17, 76 23 
             C 83 23, 86 31, 82 36 
             C 85 41, 78 45, 74 42 
             C 68 46, 58 43, 53 41 
             C 47 45, 37 45, 32 40 
             C 26 43, 21 38, 23 32 Z"
          fill={`url(#foamGrad_${isFlipped ? 'r' : 'l'})`}
          stroke="#fef08a"
          strokeWidth="1.5"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        />

        {/* Foam Drip running down front edge */}
        <path
          d="M 68 36 C 68 48, 73 48, 73 38"
          fill="#fef3c7"
          stroke="#fef08a"
          strokeWidth="1"
        />
        <circle cx="71" cy="52" r="1.5" fill="#ffffff" opacity="0.8" />
      </svg>
    </div>
  );
}

/**
 * Animated Flying Foam Particles spraying outward from the collision point.
 */
function FlyingFoamParticles({ tier }: { tier: CheersTier }) {
  // Foam droplets with varied angles, trajectories, and delays
  const particleCount = tier === 'EPIC' ? 14 : tier === 'MEGA' ? 10 : 7;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = ((i * (360 / particleCount)) - 90) * (Math.PI / 180);
    const distance = 42 + (i % 3) * 16;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 18; // bias upwards
    const size = 6 + (i % 4) * 3;
    const delay = 0.15 + (i * 0.03);
    return { id: i, dx, dy, size, delay };
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {/* Central Starburst Spark */}
      <div className="absolute w-20 h-20 rounded-full bg-amber-300/40 blur-xl animate-cheers-burst" />
      <div className="absolute w-6 h-6 rounded-full bg-white shadow-[0_0_24px_#fff] animate-cheers-burst" />

      {/* Outward spraying foam droplets */}
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `foamSplashOut 1.8s cubic-bezier(0.12, 0.8, 0.32, 1) ${p.delay}s forwards`,
            transform: 'translate(0, 0) scale(0)',
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
          }}
          className="absolute rounded-full bg-gradient-to-br from-white via-amber-100 to-amber-200 border border-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)] opacity-0"
        />
      ))}

      {/* Extra beer splash arcs for MEGA and EPIC */}
      {(tier === 'MEGA' || tier === 'EPIC') && (
        <>
          <div className="absolute w-28 h-28 rounded-full border-2 border-amber-400/80 animate-cheers-burst" />
          <div
            className="absolute w-36 h-36 rounded-full border-4 border-yellow-300/60 animate-cheers-burst"
            style={{ animationDelay: '0.1s' }}
          />
        </>
      )}

      {tier === 'EPIC' && (
        <div
          className="absolute w-48 h-48 rounded-full border-2 border-purple-400/50 animate-cheers-burst"
          style={{ animationDelay: '0.15s' }}
        />
      )}
    </div>
  );
}

export function CheersAnimationOverlay({
  cheers,
  onDismiss,
}: CheersAnimationOverlayProps) {
  useEffect(() => {
    if (!cheers) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2400);
    return () => clearTimeout(timer);
  }, [cheers, onDismiss]);

  if (!cheers) return null;

  // Tier metadata styling & badges
  const tierConfig = {
    DUO: {
      badgeBg: 'bg-gradient-to-r from-cyan-600 via-amber-500 to-cyan-500',
      badgeBorder: 'border-cyan-300/90',
      glow: 'shadow-[0_0_35px_rgba(34,211,238,0.55),0_0_15px_rgba(245,158,11,0.5)]',
      textColor: 'text-cyan-200',
      icon: <Users className="w-4 h-4 text-cyan-200 animate-bounce" />,
      subtextColor: 'text-slate-100',
    },
    HEAVY: {
      badgeBg: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500',
      badgeBorder: 'border-amber-300/90',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.65)]',
      textColor: 'text-amber-200',
      icon: <Flame className="w-4 h-4 text-amber-300 animate-pulse" />,
      subtextColor: 'text-amber-100',
    },
    MEGA: {
      badgeBg: 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600',
      badgeBorder: 'border-yellow-200',
      glow: 'shadow-[0_0_50px_rgba(239,68,68,0.7),0_0_25px_rgba(251,191,36,0.8)]',
      textColor: 'text-yellow-200',
      icon: <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />,
      subtextColor: 'text-white',
    },
    EPIC: {
      badgeBg: 'bg-gradient-to-r from-purple-700 via-amber-500 to-rose-600',
      badgeBorder: 'border-yellow-300',
      glow: 'shadow-[0_0_65px_rgba(168,85,247,0.8),0_0_30px_rgba(245,158,11,0.9)]',
      textColor: 'text-yellow-100',
      icon: <Skull className="w-4 h-4 text-yellow-300 animate-bounce" />,
      subtextColor: 'text-yellow-100 font-extrabold',
    },
  }[cheers.tier];

  return (
    <div
      key={cheers.id}
      className="fixed inset-0 z-[85] pointer-events-none flex items-center justify-center p-3 select-none"
    >
      {/* Table Center Cheers Stage */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Floating Crown above colliding mugs for EPIC tier */}
        {cheers.tier === 'EPIC' && (
          <div className="absolute -top-10 sm:-top-12 z-20 animate-bounce">
            <Crown className="w-9 h-9 sm:w-11 sm:h-11 text-amber-300 fill-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,1)]" />
          </div>
        )}

        {/* Colliding Mugs Container with Clinking Animation */}
        <div className="relative flex items-center justify-center w-52 h-32 sm:w-64 sm:h-36">
          {/* Left Mug Rushing In and Tilting */}
          <div className="animate-cheers-left z-10 shrink-0">
            <BeerMug isFlipped={false} />
          </div>

          {/* Contact Point Foam Splash and Sparkles */}
          <FlyingFoamParticles tier={cheers.tier} />

          {/* Right Mug Rushing In and Tilting */}
          <div className="animate-cheers-right z-10 shrink-0">
            <BeerMug isFlipped={true} />
          </div>
        </div>

        {/* Dynamic Cheers Banner Underneath */}
        <div className="mt-1 sm:mt-2 animate-cheers-banner flex flex-col items-center max-w-[340px] sm:max-w-[400px] text-center z-30">
          {/* Main Tier Pill */}
          <div
            className={`px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full ${tierConfig.badgeBg} border-2 ${tierConfig.badgeBorder} ${tierConfig.glow} backdrop-blur-md flex items-center gap-2 shadow-2xl`}
          >
            {tierConfig.icon}
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow-md">
              {cheers.title}
            </span>
          </div>

          {/* Subtitle / Drinkers Detail */}
          <div className="mt-1.5 px-3 py-1 rounded-2xl bg-black/80 border border-white/25 backdrop-blur-md shadow-xl flex flex-col items-center">
            <span className={`text-[10px] sm:text-[11px] ${tierConfig.subtextColor} drop-shadow-sm`}>
              {cheers.subtitle}
            </span>

            {/* If Duo/Group, render mini badges for the drinking players */}
            {cheers.drinkers.length >= 2 && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                {cheers.drinkers.map((drinker, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[9px] font-black text-white flex items-center gap-1 shadow-sm"
                  >
                    <span>{drinker.name}</span>
                    <span className="text-amber-300">({drinker.sips}🍺)</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
