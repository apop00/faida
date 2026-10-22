'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '@/types/game';
import { playBottleLaunchSound } from '@/lib/audioEffects';

interface AttackTrajectoryOverlayProps {
  state: GameState;
  controllingPlayerIndex: number;
}

export function AttackTrajectoryOverlay({
  state,
  controllingPlayerIndex,
}: AttackTrajectoryOverlayProps) {
  // 1. Determine if there is an active targeted attack or special event
  let attackerIdx: number | null = null;
  let defenderIdx: number | null = null;
  let sips = 0;
  let label = '';
  let projectileKind: 'SIPS' | 'BURDEN' | 'SPY' = 'SIPS';

  if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex !== null) {
    attackerIdx = state.activePlayerIndex;
    defenderIdx = state.defenderIndex;
    sips = state.currentSips;
    label = sips === 1 ? '1 Sorso!' : `${sips} Sorsi!`;
    projectileKind = 'SIPS';
  } else if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
    const ev = state.specialEvent;
    if (ev.type === 'DIRECT_SIPS_ATTACK') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      sips = ev.sipsAmount;
      label = `Colpo Diretto ${sips}🍺`;
      projectileKind = 'SIPS';
    } else if (ev.type === 'QUEEN_BURDEN') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      label = 'Fardello +2🃏';
      projectileKind = 'BURDEN';
    } else if (ev.type === 'JACK_SPY') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      label = 'Spionaggio 👁️';
      projectileKind = 'SPY';
    }
  }

  // 2. Also track one-shot drink launches when a direct hit occurs
  const [oneShotLaunch, setOneShotLaunch] = useState<{
    attackerIdx: number;
    defenderIdx: number;
    sips: number;
    label: string;
  } | null>(null);

  const prevDrinkEventKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.lastDrinkEvent) {
      const ev = state.lastDrinkEvent;
      const key = `${ev.senderIndex}->${ev.drinkerIndex}:${ev.sips}:${ev.reason}`;
      if (
        key !== prevDrinkEventKeyRef.current &&
        ev.senderIndex !== undefined &&
        ev.drinkerIndex !== undefined &&
        ev.senderIndex !== ev.drinkerIndex &&
        ev.senderIndex >= 0 &&
        ev.senderIndex < 4 &&
        ev.drinkerIndex >= 0 &&
        ev.drinkerIndex < 4
      ) {
        prevDrinkEventKeyRef.current = key;
        setOneShotLaunch({
          attackerIdx: ev.senderIndex,
          defenderIdx: ev.drinkerIndex,
          sips: ev.sips,
          label: `${ev.sips}🍺 ${ev.cardLabel ? `(${ev.cardLabel})` : ''}`,
        });
        playBottleLaunchSound();
        const timer = setTimeout(() => {
          setOneShotLaunch(null);
        }, 1900);
        return () => clearTimeout(timer);
      }
    }
  }, [state.lastDrinkEvent]);

  // Fallback to one-shot launch if no ongoing continuous trajectory is active
  if (attackerIdx === null && oneShotLaunch) {
    attackerIdx = oneShotLaunch.attackerIdx;
    defenderIdx = oneShotLaunch.defenderIdx;
    sips = oneShotLaunch.sips;
    label = oneShotLaunch.label;
    projectileKind = 'SIPS';
  }

  // Sound trigger on new ongoing attack
  const lastAttackRef = useRef<string | null>(null);
  useEffect(() => {
    if (attackerIdx !== null && defenderIdx !== null) {
      const attackKey = `${attackerIdx}->${defenderIdx}:${label}`;
      if (attackKey !== lastAttackRef.current) {
        lastAttackRef.current = attackKey;
        if (projectileKind === 'SIPS') {
          playBottleLaunchSound();
        }
      }
    } else {
      lastAttackRef.current = null;
    }
  }, [attackerIdx, defenderIdx, label, projectileKind]);

  if (
    state.activeDuel ||
    state.activeReflex ||
    state.mode === 'GAME_OVER' ||
    attackerIdx === null ||
    defenderIdx === null ||
    attackerIdx === defenderIdx
  ) {
    return null;
  }

  // Seat coordinates in SVG viewbox (1000 x 1000 spanning the entire full arena)
  // Opponents: 1 (West - Left), 2 (North - Top Center in header), 3 (East - Right).
  // Local/Bottom player: 0 (South - Bottom hand/seat)
  const getSeatCoords = (idx: number): { x: number; y: number } => {
    switch (idx) {
      case 1:
        return { x: 105, y: 440 }; // West (Left) opponent
      case 2:
        return { x: 500, y: 60 };  // North (Top Center) opponent in top bar
      case 3:
        return { x: 895, y: 440 }; // East (Right) opponent
      case 0:
      default:
        return { x: 500, y: 880 }; // South (Bottom) local player
    }
  };

  const start = getSeatCoords(attackerIdx);
  const end = getSeatCoords(defenderIdx);

  // Calculate curve control point (cx, cy) to produce a playful, natural parabolic 3D toss
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);

  let cx = midX;
  let cy = midY;

  // A) Horizontal flight (West <-> East)
  if (Math.abs(dy) < 120) {
    // Lob high upward into the air over the table
    cy = midY - 170;
  }
  // B) Vertical flight (North <-> South)
  else if (Math.abs(dx) < 120) {
    // Curve gracefully around the central table card pile
    cx = midX + (start.y > end.y ? 130 : -130);
  }
  // C) Diagonal flight
  else {
    let nx = -dy / dist;
    let ny = dx / dist;
    // Orient curve towards table center (500, 460) or upward
    const toCenterX = 500 - midX;
    const toCenterY = 460 - midY;
    const dot = nx * toCenterX + ny * toCenterY;
    if (dot < 0) {
      nx = -nx;
      ny = -ny;
    }
    const bend = Math.min(160, dist * 0.28);
    cx = midX + nx * bend;
    cy = midY + ny * bend;
  }

  const pathD = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;

  // Apex midpoint coordinates for floating badge: B(0.5) = 0.25*start + 0.5*ctrl + 0.25*end
  const badgeX = 0.25 * start.x + 0.5 * cx + 0.25 * end.x;
  const badgeY = 0.25 * start.y + 0.5 * cy + 0.25 * end.y;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      <svg
        viewBox="0 0 1000 1000"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Glowing Golden Amber to Rose Gradient for Beer Arc */}
          <linearGradient id="beerArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.95" />
          </linearGradient>

          {/* Queen Burden Gradient */}
          <linearGradient id="burdenArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
          </linearGradient>

          {/* Jack Spy Gradient */}
          <linearGradient id="spyArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.95" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="beerGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Playful Aerodynamic Arrowhead Marker */}
          <marker
            id="beerArrowhead"
            viewBox="0 0 14 14"
            refX="11"
            refY="7"
            markerWidth="11"
            markerHeight="11"
            orient="auto"
          >
            <path
              d="M 1 2 L 13 7 L 1 12 C 3 9 3 5 1 2 Z"
              fill={projectileKind === 'BURDEN' ? '#a855f7' : projectileKind === 'SPY' ? '#06b6d4' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth="0.8"
            />
          </marker>
        </defs>

        {/* Ambient Halo behind curve */}
        <path
          d={pathD}
          fill="none"
          stroke={projectileKind === 'BURDEN' ? '#a855f7' : projectileKind === 'SPY' ? '#06b6d4' : '#f59e0b'}
          strokeWidth="12"
          strokeOpacity="0.22"
          filter="url(#beerGlow)"
          strokeLinecap="round"
        />

        {/* Main Animated Trajectory Arc with Crawling Dashes (slower and smoother: 1.6s) */}
        <path
          d={pathD}
          fill="none"
          stroke={
            projectileKind === 'BURDEN'
              ? 'url(#burdenArcGradient)'
              : projectileKind === 'SPY'
              ? 'url(#spyArcGradient)'
              : 'url(#beerArcGradient)'
          }
          strokeWidth="4.5"
          strokeDasharray="12 12"
          strokeLinecap="round"
          markerEnd="url(#beerArrowhead)"
          className="animate-beer-dash"
          filter="url(#beerGlow)"
        />

        {/* Trajectory Origin Launch Burst (Attacker) */}
        <circle
          cx={start.x}
          cy={start.y}
          r="10"
          fill={projectileKind === 'BURDEN' ? '#a855f7' : projectileKind === 'SPY' ? '#06b6d4' : '#f59e0b'}
          className="animate-ping opacity-75"
        />
        <circle
          cx={start.x}
          cy={start.y}
          r="6"
          fill="#fde047"
        />

        {/* Target Destination Splash Pulse (Defender) */}
        <circle
          cx={end.x}
          cy={end.y}
          r="26"
          fill="none"
          stroke={projectileKind === 'BURDEN' ? '#ec4899' : projectileKind === 'SPY' ? '#38bdf8' : '#f59e0b'}
          strokeWidth="2.5"
          className="animate-ping opacity-60"
        />
        <circle
          cx={end.x}
          cy={end.y}
          r="14"
          fill={projectileKind === 'BURDEN' ? '#a855f7' : projectileKind === 'SPY' ? '#06b6d4' : '#ef4444'}
          opacity="0.25"
          className="animate-pulse"
        />
        {/* Destination Splash Droplets */}
        {projectileKind === 'SIPS' && (
          <g>
            <circle cx={end.x - 14} cy={end.y - 12} r="3" fill="#ffffff" className="animate-foam-pulse" />
            <circle cx={end.x + 16} cy={end.y - 10} r="2.5" fill="#fef08a" className="animate-foam-pulse" />
            <circle cx={end.x + 8} cy={end.y + 14} r="3.5" fill="#ffffff" className="animate-foam-pulse" />
          </g>
        )}

        {/* =======================================================================
            PROJECTILE FLYING ALONG THE ARC (Slightly slower 1.7s loop)
           ======================================================================= */}

        {/* 1. BEER BOTTLE PROJECTILE (with foam bubbles trail & wobble) */}
        {projectileKind === 'SIPS' && (
          <>
            {/* Trailing foam bubbles streaming along the exact path curve */}
            <g>
              <animateMotion
                path={pathD}
                dur="1.7s"
                repeatCount="indefinite"
                rotate="auto"
                begin="-0.15s"
              />
              <circle r="3.5" fill="#ffffff" opacity="0.8" />
              <circle r="2" fill="#fef08a" opacity="0.9" />
            </g>
            <g>
              <animateMotion
                path={pathD}
                dur="1.7s"
                repeatCount="indefinite"
                rotate="auto"
                begin="-0.3s"
              />
              <circle r="2.8" fill="#fef08a" opacity="0.65" />
            </g>
            <g>
              <animateMotion
                path={pathD}
                dur="1.7s"
                repeatCount="indefinite"
                rotate="auto"
                begin="-0.45s"
              />
              <circle r="2" fill="#ffffff" opacity="0.45" />
            </g>

            {/* Main Thrown Beer Bottle (Oriented along +X direction of motion) */}
            <g>
              <animateMotion
                path={pathD}
                dur="1.7s"
                repeatCount="indefinite"
                rotate="auto"
              />

              {/* Trailing foam attached right behind the bottle base */}
              <circle cx="-18" cy="0" r="3.5" fill="#ffffff" opacity="0.8" className="animate-foam-pulse" />
              <circle cx="-25" cy="-2" r="2.8" fill="#fef08a" opacity="0.65" className="animate-foam-pulse" />
              <circle cx="-32" cy="1.5" r="2.2" fill="#fbbf24" opacity="0.5" className="animate-foam-pulse" />

              {/* Rotating / Wobbling Bottle Graphic */}
              <g className="animate-bottle-spin">
                {/* Soft ground shadow underneath bottle */}
                <ellipse cx="0" cy="12" rx="15" ry="5" fill="#000000" opacity="0.3" filter="url(#beerGlow)" />

                {/* Amber Glass Bottle Body */}
                <path
                  d="M -14 -6 L -2 -6 C 1 -6 3 -3 5 -1.5 L 12 -1.5 L 12 1.5 L 5 1.5 C 3 3 1 6 -2 6 L -14 6 C -16 6 -17 4 -17 0 C -17 -4 -16 -6 -14 -6 Z"
                  fill="#b45309"
                  stroke="#78350f"
                  strokeWidth="1.2"
                />

                {/* Golden Beer Liquid Highlight */}
                <path
                  d="M -13 -4.5 L -2 -4.5 C 0 -4.5 2 -2 4 -0.8 L 11 -0.8 L 11 0.8 L 4 0.8 C 2 2 0 4.5 -2 4.5 L -13 4.5 C -14.5 4.5 -15.5 3 -15.5 0 C -15.5 -3 -14.5 -4.5 -13 -4.5 Z"
                  fill="#f59e0b"
                />
                <path
                  d="M -12 -3 L -3 -3 C -1 -3 1 -1 3 0 L -3 0 C -5 0 -7 2 -12 2 Z"
                  fill="#fef08a"
                  opacity="0.8"
                />

                {/* Bottle Label: "FAIDA 🍺" */}
                <rect x="-10" y="-4.5" width="7" height="9" rx="1" fill="#fef3c7" stroke="#92400e" strokeWidth="0.6" />
                <text x="-6.5" y="1.2" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#78350f">
                  🍺
                </text>

                {/* Gold Crown Cap at neck */}
                <rect x="12" y="-2.5" width="2.5" height="5" rx="0.6" fill="#fde047" stroke="#b45309" strokeWidth="0.6" />

                {/* Frothy White Beer Foam erupting forward */}
                <circle cx="15.5" cy="-1.5" r="2.4" fill="#ffffff" />
                <circle cx="17.2" cy="1.2" r="2.8" fill="#ffffff" />
                <circle cx="19.5" cy="-0.5" r="3.2" fill="#ffffff" />
                <circle cx="22.5" cy="1" r="2" fill="#fef08a" />
                <circle cx="21" cy="-2.5" r="1.8" fill="#ffffff" />
              </g>
            </g>
          </>
        )}

        {/* 2. QUEEN BURDEN PROJECTILE (Flying Spiked Crown with Chain) */}
        {projectileKind === 'BURDEN' && (
          <g>
            <animateMotion
              path={pathD}
              dur="1.7s"
              repeatCount="indefinite"
              rotate="auto"
            />
            {/* Trailing dark energy */}
            <circle cx="-16" cy="0" r="3" fill="#a855f7" opacity="0.6" />
            <circle cx="-24" cy="0" r="2" fill="#ec4899" opacity="0.4" />

            <g className="animate-bottle-spin">
              <text x="0" y="6" textAnchor="middle" fontSize="22" filter="url(#beerGlow)">
                👑
              </text>
            </g>
          </g>
        )}

        {/* 3. JACK SPY PROJECTILE (Flying Magic Crystal Eye) */}
        {projectileKind === 'SPY' && (
          <g>
            <animateMotion
              path={pathD}
              dur="1.7s"
              repeatCount="indefinite"
              rotate="auto"
            />
            {/* Trailing scan waves */}
            <circle cx="-16" cy="0" r="3" fill="#06b6d4" opacity="0.6" />
            <circle cx="-24" cy="0" r="2" fill="#3b82f6" opacity="0.4" />

            <g className="animate-bottle-spin">
              <text x="0" y="6" textAnchor="middle" fontSize="22" filter="url(#beerGlow)">
                👁️
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Floating Comic Badge at Arc Apex (Remains upright, readable and cheerful) */}
      <div
        style={{
          left: `${(badgeX / 1000) * 100}%`,
          top: `${(badgeY / 1000) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute z-40 pointer-events-none"
      >
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-white shadow-xl animate-comic-bounce select-none ${
            projectileKind === 'BURDEN'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.7)]'
              : projectileKind === 'SPY'
              ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.7)]'
              : 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.75)]'
          }`}
        >
          <span className="text-sm">
            {projectileKind === 'BURDEN' ? '👑' : projectileKind === 'SPY' ? '👁️' : '🍺'}
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
            {label}
          </span>
          <span className="text-sm">🎯</span>
        </div>
      </div>
    </div>
  );
}
