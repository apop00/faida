'use client';

import React from 'react';
import { GameState } from '@/types/game';

interface AttackTrajectoryOverlayProps {
  state: GameState;
  controllingPlayerIndex: number;
}

export function AttackTrajectoryOverlay({
  state,
  controllingPlayerIndex,
}: AttackTrajectoryOverlayProps) {
  // Determine if there is an active targeted attack or special event
  let attackerIdx: number | null = null;
  let defenderIdx: number | null = null;
  let sips = 0;
  let label = '';
  let isMirror = false;

  if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex !== null) {
    attackerIdx = state.activePlayerIndex;
    defenderIdx = state.defenderIndex;
    sips = state.currentSips;
    label = `${sips}🍺`;
  } else if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
    const ev = state.specialEvent;
    if (ev.type === 'DIRECT_SIPS_ATTACK') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      sips = ev.sipsAmount;
      label = `Colpo Diretto ${sips}🍺`;
    } else if (ev.type === 'QUEEN_BURDEN') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      label = 'Fardello +2🃏';
    } else if (ev.type === 'JACK_SPY') {
      attackerIdx = ev.attackerIndex;
      defenderIdx = ev.targetIndex;
      label = 'Spionaggio 👁️';
    }
  }

  if (attackerIdx === null || defenderIdx === null || attackerIdx === defenderIdx) {
    return null;
  }

  // Seat coordinates in SVG viewbox (1000 x 1000)
  // Opponents: 1 (West - Left), 2 (North - Top Center), 3 (East - Right). Local/Bottom: 0 (South - Bottom)
  const getSeatCoords = (idx: number): { x: number; y: number } => {
    switch (idx) {
      case 1:
        return { x: 120, y: 460 }; // West (Left) opponent
      case 2:
        return { x: 500, y: 90 };  // North (Top Center) opponent
      case 3:
        return { x: 880, y: 460 }; // East (Right) opponent
      case 0:
      default:
        return { x: 500, y: 880 }; // Bottom local player
    }
  };

  const start = getSeatCoords(attackerIdx);
  const end = getSeatCoords(defenderIdx);

  // Calculate curve control point bending through the central table (500, 480)
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  // Curve slightly towards center
  const cx = midX + (500 - midX) * 0.45;
  const cy = midY + (480 - midY) * 0.45;

  const pathD = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;

  // Point at midpoint of quadratic bezier: B(0.5) = 0.25*start + 0.5*ctrl + 0.25*end
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
          {/* Glowing Neon Gradient for the Laser */}
          <linearGradient id="attackLaserGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.95" />
          </linearGradient>

          {/* Glow Filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated Arrowhead Marker */}
          <marker
            id="laserArrow"
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 11 6 L 0 11 Z" fill="#f43f5e" />
          </marker>
        </defs>

        {/* Ambient Halo behind beam */}
        <path
          d={pathD}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="14"
          strokeOpacity="0.25"
          filter="url(#neonGlow)"
        />

        {/* Main Animated Laser Beam */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#attackLaserGradient)"
          strokeWidth="4.5"
          strokeDasharray="14 8"
          markerEnd="url(#laserArrow)"
          className="animate-laser-dash"
          filter="url(#neonGlow)"
        />

        {/* Trajectory Origin Pulse */}
        <circle
          cx={start.x}
          cy={start.y}
          r="10"
          fill="#f43f5e"
          className="animate-ping opacity-75"
        />
        <circle cx={start.x} cy={start.y} r="6" fill="#fb7185" />

        {/* Target Destination Pulse */}
        <circle
          cx={end.x}
          cy={end.y}
          r="14"
          fill="#f43f5e"
          className="animate-pulse opacity-60"
        />
      </svg>

      {/* Floating Badge at Midpoint of Trajectory */}
      <div
        style={{
          left: `${(badgeX / 1000) * 100}%`,
          top: `${(badgeY / 1000) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="absolute z-40 pointer-events-none"
      >
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/90 border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-bounce">
          <span className="text-xs">⚔️</span>
          <span className="text-[10px] sm:text-xs font-black text-rose-300 uppercase tracking-wider whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
