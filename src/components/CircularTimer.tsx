'use client';

import React from 'react';
import { Pause, Play } from 'lucide-react';

interface CircularTimerProps {
  seconds: number;
  maxSeconds?: number;
  active: boolean;
  paused: boolean;
  onTogglePause: () => void;
}

export function CircularTimer({
  seconds,
  maxSeconds = 7,
  active,
  paused,
  onTogglePause,
}: CircularTimerProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(maxSeconds, seconds));
  const progress = active ? clamped / maxSeconds : 1;
  const strokeDashoffset = circumference * (1 - progress);

  // Color progression: Green (> 4s) -> Yellow (3-4s) -> Red flashing (<= 2s)
  let strokeColor = '#10b981'; // Emerald
  let textColor = 'text-emerald-400';
  let ringPulse = '';

  if (!active) {
    strokeColor = '#334155';
    textColor = 'text-slate-400';
  } else if (seconds <= 2) {
    strokeColor = '#f43f5e'; // Rose red
    textColor = 'text-rose-400';
    ringPulse = 'animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]';
  } else if (seconds <= 4) {
    strokeColor = '#f59e0b'; // Amber yellow
    textColor = 'text-amber-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`relative w-14 h-14 flex items-center justify-center ${ringPulse}`}>
        <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="5"
          />
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className={`text-base font-black ${textColor}`}>
            {active ? `${seconds}s` : '—'}
          </span>
          <span className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">
            {active ? (paused ? 'PAUSA' : 'TIMER') : 'TREGUA'}
          </span>
        </div>
      </div>

      {active && (
        <button
          type="button"
          onClick={onTogglePause}
          title={paused ? 'Riprendi Timer' : 'Metti in Pausa Timer'}
          className="p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-slate-200 transition cursor-pointer"
        >
          {paused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
