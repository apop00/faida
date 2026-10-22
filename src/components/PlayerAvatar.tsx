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

  // Dynamic reaction bubble text and emoji
  let reaction: { emoji: string; text: string; tone: string } | null = null;

  if (sipsDelta > 0) {
    reaction = {
      emoji: '😵',
      text: `+${sipsDelta}🍺 Gulp!`,
      tone: 'bg-rose-950 border-rose-500 text-rose-200',
    };
  } else if (isDefender) {
    reaction = {
      emoji: '😱',
      text: 'Devo parare!',
      tone: 'bg-rose-950 border-rose-400 text-rose-200 animate-pulse',
    };
  } else if (isAttacker) {
    reaction = {
      emoji: '😈',
      text: 'Assaggia questo!',
      tone: 'bg-amber-950 border-amber-400 text-amber-200',
    };
  } else if (isControlling) {
    reaction = {
      emoji: '🤔',
      text: 'Mmh...',
      tone: 'bg-emerald-950 border-emerald-400 text-emerald-200',
    };
  }

  const sizeClasses =
    size === 'sm'
      ? 'w-7 h-7 text-sm'
      : size === 'lg'
      ? 'w-11 h-11 text-xl'
      : 'w-8 h-8 text-base';

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Speech Bubble floating above avatar */}
      {reaction && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-speech-pop whitespace-nowrap">
          <div
            className={`px-2 py-0.5 rounded-full border shadow-lg flex items-center gap-1 text-[8px] font-black uppercase tracking-wider ${reaction.tone}`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.text}</span>
          </div>
          {/* Small Speech Bubble Tail */}
          <div className="w-1.5 h-1.5 rotate-45 mx-auto -mt-0.5 bg-inherit border-r border-b border-inherit" />
        </div>
      )}

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
