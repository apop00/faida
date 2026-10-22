'use client';

import React from 'react';
import { Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';

interface PlayerAvatarProps {
  suit: Suit;
  name: string;
  isAI?: boolean;
  isAttacker?: boolean;
  isDefender?: boolean;
  isControlling?: boolean;
  sipsDelta?: number;
  size?: 'sm' | 'md' | 'lg';
}

const FACTION_AVATARS: Record<Suit, { emoji: string; title: string }> = {
  hearts: { emoji: '🥷', title: 'Lama Scarlatta' },
  diamonds: { emoji: '🤵', title: 'Mente Dorata' },
  clubs: { emoji: '🥊', title: 'Spacca-Ossa' },
  spades: { emoji: '🕵️', title: 'Ombra Notturna' },
};

export function PlayerAvatar({
  suit,
  name,
  isAI,
  isAttacker,
  isDefender,
  isControlling,
  sipsDelta = 0,
  size = 'md',
}: PlayerAvatarProps) {
  const suitMeta = SUIT_INFO[suit];
  const avatarMeta = FACTION_AVATARS[suit];

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-sm'
      : size === 'lg'
      ? 'w-11 h-11 text-xl'
      : 'w-8 h-8 text-base';

  return (
    <div className="relative flex items-center justify-center shrink-0">

      {/* Avatar Circle */}
      <div
        className={`${sizeClasses} rounded-full bg-[#18102a] border-2 flex items-center justify-center shadow-md select-none transition-transform ${
          isDefender
            ? 'border-rose-500 ring-2 ring-rose-500/70 scale-105'
            : isAttacker
            ? 'border-amber-400 ring-2 ring-amber-400/70 scale-105'
            : isControlling
            ? 'border-emerald-400 ring-2 ring-emerald-400/50'
            : 'border-white/20'
        }`}
        title={`${name} (${avatarMeta.title})`}
      >
        <span className="leading-none">{avatarMeta.emoji}</span>
      </div>
    </div>
  );
}
