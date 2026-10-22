'use client';

import React, { useEffect } from 'react';
import { Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { Beer, Sparkles, Swords, ArrowRight, X } from 'lucide-react';
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
    // Only play simple drink sound for minor sips (< 3); 3+ sips are celebrated with the Cheers Cin-Cin fanfare!
    if (alert && alert.sips < 3) {
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md max-h-[96vh] sm:max-h-[320px] rounded-3xl bg-gradient-to-b from-[#2b0c16] via-[#1a0815] to-[#0d0312] border-2 border-rose-500/80 shadow-[0_0_60px_rgba(244,63,94,0.45)] p-3 sm:p-4 text-slate-100 flex flex-col justify-between overflow-y-auto no-scrollbar my-auto cursor-default animate-scaleIn relative"
      >
        {/* Pulsante Rapido Chiudi in alto a destra */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer z-20 transition"
          title="Chiudi avviso"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tag */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-black uppercase tracking-wider mx-auto mb-1 shrink-0">
          <Beer className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          <span>Momento Sorso</span>
        </div>

        {/* Big Action Callout: Who struck you! */}
        {alert.fromPlayerName ? (
          <div className="w-full mb-1 shrink-0">
            <h2 className="text-sm sm:text-base font-black text-rose-400 uppercase tracking-tight flex items-center justify-center gap-1">
              <Swords className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>COLPITO DA {alert.fromPlayerName.toUpperCase()}!</span>
            </h2>

            {/* Chiaro Box Mittente -> Destinatario */}
            <div className="mt-1 w-full py-1 px-2 rounded-xl bg-black/50 border border-rose-500/30 flex items-center justify-between shadow-inner">
              {/* MITTENTE */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[7px] font-black uppercase tracking-wider text-rose-400/90 leading-none mb-0.5">
                  Mittente ⚔️
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-rose-500/15 border border-rose-500/30 max-w-full">
                  {fromSuitMeta && (
                    <span className={`text-[11px] font-black leading-none ${fromSuitMeta.neonText}`}>
                      {fromSuitMeta.symbol}
                    </span>
                  )}
                  <span className="text-[11px] font-extrabold text-white truncate max-w-[80px]">
                    {alert.fromPlayerName}
                  </span>
                </div>
              </div>

              {/* FRECCIA E CARTA */}
              <div className="flex flex-col items-center px-1 shrink-0">
                <ArrowRight className="w-3 h-3 text-rose-400 animate-pulse" />
                {alert.cardLabel && (
                  <span className="mt-0.5 px-1 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black shadow border border-white/20 whitespace-nowrap leading-none">
                    {alert.cardLabel}{cardSuitMeta?.symbol || ''}
                  </span>
                )}
              </div>

              {/* BERSAGLIO (TU) */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span className="text-[7px] font-black uppercase tracking-wider text-amber-300/90 leading-none mb-0.5">
                  Bersaglio 🎯
                </span>
                <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-400/15 border border-amber-400/30 max-w-full">
                  <span className={`text-[11px] font-black leading-none ${suitMeta.neonText}`}>
                    {suitMeta.symbol}
                  </span>
                  <span className="text-[11px] font-extrabold text-white truncate max-w-[80px]">
                    {alert.playerName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-1 text-center shrink-0">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <span className={`text-sm font-black ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
              <span className="text-xs font-extrabold text-white">
                {alert.playerName}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-rose-400 uppercase tracking-tight">
              DEVI BERE!
            </h2>
          </div>
        )}

        {/* Big Sips Display */}
        <div className="my-1 w-full py-1.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600/30 via-amber-500/30 to-rose-600/30 border-2 border-amber-400/80 text-amber-300 flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(245,158,11,0.25)] shrink-0">
          <span className="text-2xl sm:text-3xl animate-pulse">🍺</span>
          <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)]">
            +{alert.sips}
          </span>
          <div className="text-left">
            <span className="block text-xs font-black uppercase text-amber-300 leading-tight">
              {alert.sips === 1 ? 'Sorso' : 'Sorsi'}
            </span>
            <span className="block text-[8px] font-bold uppercase text-slate-300 leading-tight">
              {alert.fromPlayerName ? `Da ${alert.fromPlayerName}` : 'Da Mandare Giù'}
            </span>
          </div>
        </div>

        {/* Reason / Context */}
        <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium my-1 px-1 line-clamp-1 text-center shrink-0">
          {alert.reason}
        </p>

        {/* Confirm Drink Button Sempre Visibile Senza Scorrere */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 hover:from-amber-300 hover:to-rose-400 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>HO BEVUTO! 🍻 ({alert.sips} {alert.sips === 1 ? 'Sorso' : 'Sorsi'})</span>
        </button>
      </div>
    </div>
  );
}
