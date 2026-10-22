'use client';

import React from 'react';
import { Card, CardPlayability } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { Info } from 'lucide-react';

interface PlayingCardProps {
  card: Card;
  playability?: CardPlayability;
  selected?: boolean;
  isBonusCandidate?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  onInspect?: (card: Card) => void;
  interactive?: boolean;
}

export function PlayingCard({
  card,
  playability,
  selected = false,
  isBonusCandidate = false,
  size = 'md',
  onClick,
  onInspect,
  interactive = false,
}: PlayingCardProps) {
  const suitMeta = SUIT_INFO[card.suit];
  const isPlayable = playability?.playable ?? true;

  // Non-playable cards in hand maintain full readable size with slight dimming
  const effectiveSize = size;

  const sizeClasses = {
    xs: 'w-[58px] h-[84px] rounded-lg p-1',
    sm: 'w-[66px] h-[96px] sm:w-[70px] sm:h-[102px] rounded-xl p-1 sm:p-1.5',
    md: 'w-[78px] h-[110px] sm:w-[82px] sm:h-[116px] rounded-2xl p-1.5',
    lg: 'w-[96px] h-[136px] rounded-2xl p-2',
  }[effectiveSize];

  const centerSymbolSize = {
    xs: 'text-2xl',
    sm: 'text-3xl sm:text-4xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }[effectiveSize];

  const cornerLabelSize = {
    xs: 'text-xs',
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
  }[effectiveSize];

  const getBadgeStyle = (actionType?: CardPlayability['actionType']) => {
    switch (actionType) {
      case 'FACTION_ATTACK':
      case 'SPY_DIRECT_ATTACK':
      case 'EVENT_DUEL_HIGH':
      case 'EVENT_DUEL_LOW':
      case 'EVENT_SUPER_DUEL_HIGH':
      case 'EVENT_SUPER_DUEL_LOW':
      case 'EVENT_STOP':
        return 'bg-rose-600 text-white border-2 border-white font-black shadow-[0_2px_12px_rgba(244,63,94,0.7)]';

      case 'EVENT_DIRECT_SIPS':
      case 'EVENT_TAX_RICH':
      case 'DEFENSE_COUNTER':
      case 'DEFENSE_DEVIATE':
      case 'POWER_KING':
      case 'SPECIAL_COUNTER_KING':
        return 'bg-amber-400 text-slate-950 border-2 border-slate-900 font-black shadow-[0_2px_12px_rgba(251,191,36,0.7)]';

      case 'DEFENSE_MIRROR':
      case 'SPECIAL_COUNTER_MIRROR':
      case 'COMBO_COMPANION':
        return 'bg-fuchsia-600 text-white border-2 border-white font-black shadow-[0_2px_12px_rgba(217,70,239,0.7)]';

      case 'DEFENSE_SHIELD':
      case 'DEFENSE_STOP':
      case 'EVENT_REVERSE':
      case 'POWER_JACK':
      case 'SPECIAL_COUNTER_JACK':
        return 'bg-cyan-400 text-slate-950 border-2 border-slate-900 font-black shadow-[0_2px_12px_rgba(34,211,238,0.7)]';

      case 'DEFENSE_SHOCK':
      case 'POWER_QUEEN':
      case 'SPECIAL_COUNTER_QUEEN':
        return 'bg-purple-600 text-white border-2 border-white font-black shadow-[0_2px_12px_rgba(168,85,247,0.7)]';

      case 'LINK_DISCARD':
      case 'POWER_ACE':
      case 'EVENT_PASS_RIGHT':
      case 'SPECIAL_CASCADE_SUIT':
        return 'bg-emerald-500 text-slate-950 border-2 border-white font-black shadow-[0_2px_12px_rgba(52,211,153,0.7)]';

      default:
        return 'bg-indigo-600 text-white border-2 border-white font-black shadow-[0_2px_12px_rgba(99,102,241,0.6)]';
    }
  };

  const getCardCenterAndAccent = () => {
    if (card.eventKind) {
      switch (card.eventKind) {
        case 'DIRECT_SIPS':
          return {
            centerText: `${card.sipsAmount}🍺`,
            accent: 'text-amber-300',
          };
        case 'REVERSE_SUIT':
          return {
            centerText: `🔄`,
            accent: suitMeta.neonText,
          };
        case 'STOP_SUIT':
          return {
            centerText: `🚫`,
            accent: 'text-rose-400',
          };
        case 'PASS_RIGHT':
          return {
            centerText: '🫱',
            accent: 'text-fuchsia-300',
          };
        case 'RED_DRAW_2':
          return {
            centerText: '+2',
            accent: 'text-rose-400',
          };
        case 'BLACK_DRAW_2':
          return {
            centerText: '+2',
            accent: 'text-cyan-300',
          };
        case 'ALL_DRAW_1':
          return {
            centerText: '+1',
            accent: 'text-emerald-300',
          };
        case 'MIRROR':
          return {
            centerText: '🪞',
            accent: 'text-fuchsia-300',
          };
        case 'TAX_RICH':
          return {
            centerText: '📉',
            accent: 'text-amber-300',
          };
        case 'DUEL_HIGH':
          return {
            centerText: '⚔️▲',
            accent: 'text-rose-400',
          };
        case 'DUEL_LOW':
          return {
            centerText: '⚔️▼',
            accent: 'text-cyan-300',
          };
        case 'SUPER_DUEL_HIGH':
          return {
            centerText: '💥▲',
            accent: 'text-amber-300',
          };
        case 'SUPER_DUEL_LOW':
          return {
            centerText: '💥▼',
            accent: 'text-purple-300',
          };
      }
    }

    switch (card.value) {
      case 1:
        return {
          centerText: 'A',
          accent: suitMeta.neonText,
        };
      case 11:
        return {
          centerText: 'J',
          accent: suitMeta.neonText,
        };
      case 12:
        return {
          centerText: 'Q',
          accent: suitMeta.neonText,
        };
      case 13:
        return {
          centerText: 'K',
          accent: suitMeta.neonText,
        };
      default:
        return {
          centerText: card.label || String(card.value),
          accent: suitMeta.neonText,
        };
    }
  };

  const { centerText, accent } = getCardCenterAndAccent();

  const showSuitInCorner =
    !card.eventKind ||
    card.eventKind === 'REVERSE_SUIT' ||
    card.eventKind === 'STOP_SUIT' ||
    (card.eventKind === 'MIRROR' && card.value > 0);

  // Dynamic faction gradient backgrounds reminiscent of UNO mobile cards
  const factionCardBg = {
    hearts: 'bg-gradient-to-br from-[#2f0e1f] via-[#1a0714] to-[#0d0309] border-rose-500/80 shadow-[inset_0_0_15px_rgba(244,63,94,0.18)]',
    diamonds: 'bg-gradient-to-br from-[#2f1c08] via-[#1a0e03] to-[#0c0601] border-amber-400/80 shadow-[inset_0_0_15px_rgba(251,191,36,0.18)]',
    clubs: 'bg-gradient-to-br from-[#06261f] via-[#031511] to-[#010907] border-emerald-400/80 shadow-[inset_0_0_15px_rgba(52,211,153,0.18)]',
    spades: 'bg-gradient-to-br from-[#220d36] via-[#13061f] to-[#08020d] border-purple-400/80 shadow-[inset_0_0_15px_rgba(168,85,247,0.18)]',
  }[card.suit];

  return (
    <div className="relative select-none touch-pan-x pt-3.5">
      {/* Clean Action Pill floating directly above the card */}
      {interactive && isPlayable && playability?.badgeLabel && (
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 z-40 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-2 border-white shadow-[0_3px_12px_rgba(0,0,0,0.85)] animate-pulse drop-shadow-md pointer-events-none ${getBadgeStyle(
            playability.actionType
          )}`}
        >
          {playability.badgeLabel}
        </div>
      )}

      {/* Target Bonus Indicator Pill */}
      {isBonusCandidate && (
        <div className="absolute top-1 -right-1 z-40 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white tracking-wider pointer-events-none">
          🎯 3🍺
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (interactive && !isPlayable) {
            onInspect?.(card);
          } else if (onClick) {
            onClick();
          } else if (onInspect) {
            onInspect(card);
          }
        }}
        className={`relative ${sizeClasses} flex flex-col justify-between ${factionCardBg} border-2 transition-all duration-200 overflow-hidden touch-pan-x ${
          interactive
            ? isPlayable
              ? selected
                ? 'border-amber-300 ring-4 ring-amber-400 shadow-[0_12px_30px_rgba(251,191,36,0.7)] cursor-pointer z-30'
                : `${suitMeta.neonBorder} shadow-lg cursor-pointer`
              : 'opacity-50 saturate-75 hover:opacity-85 hover:saturate-100 border-white/10 cursor-pointer'
            : onClick || onInspect
            ? `${suitMeta.neonBorder} shadow-xl hover:scale-105 active:scale-95 cursor-pointer`
            : `${suitMeta.neonBorder} shadow-xl`
        }`}
      >
        {/* Info / Ingrandisci Icon in top-right */}
        {onInspect && effectiveSize !== 'xs' && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onInspect(card);
            }}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black text-amber-300 hover:text-white border border-white/20 z-20 transition-all active:scale-90 cursor-pointer shadow"
            title="Ingrandisci e leggi effetto"
          >
            <Info className="w-2.5 h-2.5" />
          </div>
        )}

        {/* Top-left rank & suit */}
        <div className="flex items-center gap-0.5 leading-none z-10">
          <span className={`font-black ${cornerLabelSize} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
            {card.label}
          </span>
          {showSuitInCorner && (
            <span className={`text-xs sm:text-sm ${suitMeta.neonText}`}>
              {suitMeta.symbol}
            </span>
          )}
        </div>

        {/* Center UNO-Style Oval with Big Bold Number or Event Icon */}
        <div className="relative my-auto flex flex-col items-center justify-center w-full">
          {/* Characteristic UNO tilted ellipse container */}
          <div className="w-[86%] aspect-[1/0.88] -rotate-12 rounded-[50%] bg-gradient-to-tr from-black/85 via-slate-950/90 to-black/75 border border-white/20 flex flex-col items-center justify-center shadow-inner py-1 px-0.5">
            <span
              className={`${centerSymbolSize} font-black ${accent} leading-none tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] rotate-12`}
            >
              {centerText}
            </span>
            {/* Subtle suit symbol inside the oval for regular cards */}
            {!card.eventKind && (
              <span className={`text-xs sm:text-sm ${suitMeta.neonText} leading-none mt-0.5 rotate-12 opacity-90`}>
                {suitMeta.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Bottom-right rank & suit */}
        <div className="flex items-center justify-end gap-0.5 leading-none z-10 rotate-180">
          <span className={`font-black ${cornerLabelSize} text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
            {card.label}
          </span>
          {showSuitInCorner && (
            <span className={`text-[11px] sm:text-xs ${suitMeta.neonText}`}>
              {suitMeta.symbol}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
