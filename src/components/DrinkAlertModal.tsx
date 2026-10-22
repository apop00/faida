'use client';

import React, { useEffect } from 'react';
import { Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { Beer, Sparkles, Swords, ArrowRight } from 'lucide-react';
import { playDrinkSound } from '@/lib/audioEffects';

export interface DrinkAlertData {
  playerName: string;
  suit: Suit;
  sips: number;
  reason: string;
  fromPlayerName?: string;
  fromPlayerSuit?: Suit;
  cardLabel?: string;
  cardSuit?: Suit;
  customTitle?: string;
}

interface DrinkAlertModalProps {
  alert: DrinkAlertData | null;
  onDismiss: () => void;
}

export function DrinkAlertModal({ alert, onDismiss }: DrinkAlertModalProps) {
  useEffect(() => {
    if (alert) {
      playDrinkSound();
    }
  }, [alert]);

  if (!alert) return null;

  const suitMeta = SUIT_INFO[alert.suit];
  const fromSuitMeta = alert.fromPlayerSuit ? SUIT_INFO[alert.fromPlayerSuit] : null;
  const cardSuitMeta = alert.cardSuit ? SUIT_INFO[alert.cardSuit] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2b0c16] via-[#1a0815] to-[#0d0312] border-2 border-rose-500/80 shadow-[0_0_80px_rgba(244,63,94,0.45)] p-5 sm:p-6 text-slate-100 flex flex-col items-center text-center my-auto cursor-default animate-scaleIn"
      >
        {/* Header Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[11px] font-black uppercase tracking-wider mb-2">
          <Beer className="w-4 h-4 text-rose-400 animate-bounce" />
          <span>Momento Sorso</span>
        </div>

        {/* Big Action Callout: Who struck you! */}
        {alert.fromPlayerName ? (
          <div className="w-full mb-3">
            <h2 className="text-xl sm:text-2xl font-black text-rose-400 uppercase tracking-tight flex items-center justify-center gap-1.5">
              <Swords className="w-5 h-5 text-rose-400 shrink-0" />
              <span>COLPITO DA {alert.fromPlayerName.toUpperCase()}!</span>
            </h2>

            {/* Chiaro Box Mittente -> Destinatario */}
            <div className="mt-2.5 w-full p-2.5 rounded-2xl bg-black/50 border border-rose-500/30 flex items-center justify-between shadow-inner">
              {/* MITTENTE */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[8px] font-black uppercase tracking-wider text-rose-400/90 mb-0.5">
                  Mittente ⚔️
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 max-w-full">
                  {fromSuitMeta && (
                    <span className={`text-xs font-black leading-none ${fromSuitMeta.neonText}`}>
                      {fromSuitMeta.symbol}
                    </span>
                  )}
                  <span className="text-xs font-extrabold text-white truncate">
                    {alert.fromPlayerName}
                  </span>
                </div>
              </div>

              {/* FRECCIA E CARTA */}
              <div className="flex flex-col items-center px-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                {alert.cardLabel && (
                  <span className="mt-0.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black shadow border border-white/20 whitespace-nowrap leading-none">
                    {alert.cardLabel}{cardSuitMeta?.symbol || ''}
                  </span>
                )}
              </div>

              {/* BERSAGLIO (TU) */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[8px] font-black uppercase tracking-wider text-amber-300/90 mb-0.5">
                  Bersaglio 🎯
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 max-w-full">
                  <span className={`text-xs font-black leading-none ${suitMeta.neonText}`}>
                    {suitMeta.symbol}
                  </span>
                  <span className="text-xs font-extrabold text-white truncate">
                    {alert.playerName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`text-base font-black ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
              <span className="text-sm font-extrabold text-white">
                {alert.playerName}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-400 uppercase tracking-tight">
              DEVI BERE!
            </h2>
          </div>
        )}

        {/* Big Sips Display */}
        <div className="my-2.5 w-full py-3.5 px-5 rounded-3xl bg-gradient-to-r from-rose-600/30 via-amber-500/30 to-rose-600/30 border-2 border-amber-400/80 text-amber-300 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
          <span className="text-4xl animate-pulse">🍺</span>
          <span className="text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
            +{alert.sips}
          </span>
          <div className="text-left">
            <span className="block text-xs font-black uppercase text-amber-300 leading-tight">
              {alert.sips === 1 ? 'Sorso' : 'Sorsi'}
            </span>
            <span className="block text-[9px] font-bold uppercase text-slate-300 leading-tight">
              {alert.fromPlayerName ? `Da ${alert.fromPlayerName}` : 'Da Mandare Giù'}
            </span>
          </div>
        </div>

        {/* Reason / Context */}
        <p className="text-xs text-slate-300 font-medium mb-4 px-2 line-clamp-2">
          {alert.reason}
        </p>

        {/* Confirm Drink Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 hover:from-amber-300 hover:to-rose-400 active:scale-[0.97] text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(245,158,11,0.5)] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>HO BEVUTO! 🍻</span>
        </button>

        <span className="text-[10px] text-slate-400 font-medium mt-2">
          Tocca il pulsante per continuare la partita
        </span>
      </div>
    </div>
  );
}
