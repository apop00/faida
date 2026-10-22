'use client';

import React from 'react';
import { Card, CardPlayability, Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { getCardDetails } from '@/lib/cardDescriptions';
import {
  Beer,
  Crown,
  Info,
  Play,
  Shield,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';

interface CardDetailModalProps {
  card: Card | null;
  playerSuit?: Suit;
  playability?: CardPlayability;
  isTopCard?: boolean;
  onClose: () => void;
  onPlayCard?: (card: Card) => void;
}

export function CardDetailModal({
  card,
  playerSuit,
  playability,
  isTopCard = false,
  onClose,
  onPlayCard,
}: CardDetailModalProps) {
  if (!card) return null;

  const suitMeta = SUIT_INFO[card.suit];
  const details = getCardDetails(card, playerSuit);
  const isPlayable = Boolean(playability?.playable);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#130b24] border-2 border-white/20 p-5 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative max-h-[90vh] overflow-y-auto flex flex-col items-center">
        {/* Pulsante Chiudi in alto a destra */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90 z-20"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge Contesto (Carta a Terra vs Carta in Mano) */}
        <div className="w-full flex items-center justify-between mb-3 pr-8">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isTopCard
                ? 'bg-amber-400 text-slate-950 border border-amber-300'
                : 'bg-white/10 text-slate-300 border border-white/15'
            }`}
          >
            {isTopCard ? '📍 CARTA ATTUALE A TERRA' : '🃏 CARTA IN MANO'}
          </span>

          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${details.categoryColor}`}
          >
            {details.category}
          </span>
        </div>

        {/* 1. GRANDE VISUALE DELLA CARTA INGRANDITA */}
        <div className="relative my-2">
          {/* Alone luminoso colorato */}
          <div
            className={`absolute -inset-2 rounded-3xl blur-xl opacity-60 pointer-events-none ${
              card.suit === 'hearts'
                ? 'bg-rose-600'
                : card.suit === 'diamonds'
                ? 'bg-amber-500'
                : card.suit === 'clubs'
                ? 'bg-emerald-500'
                : 'bg-cyan-500'
            }`}
          />

          <div
            className={`relative w-36 h-52 rounded-2xl bg-[#191131] border-4 ${suitMeta.neonBorder} shadow-2xl flex flex-col justify-between p-3 select-none`}
          >
            {/* Angolo Top-Left */}
            <div className="flex items-center gap-1 leading-none">
              <span className="text-2xl font-black text-white">
                {card.label}
              </span>
              <span className={`text-xl ${suitMeta.neonText}`}>
                {suitMeta.symbol}
              </span>
            </div>

            {/* Centro della Carta Gigante */}
            <div className="flex flex-col items-center justify-center my-auto">
              <span className={`text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`}>
                {card.eventKind === 'DIRECT_SIPS'
                  ? `${card.sipsAmount}🍺`
                  : card.eventKind === 'MIRROR'
                  ? '🪞'
                  : card.eventKind === 'STOP_SUIT'
                  ? '🚫'
                  : card.eventKind === 'REVERSE_SUIT'
                  ? '🔄'
                  : card.eventKind === 'TAX_RICH'
                  ? '📉'
                  : card.eventKind === 'DUEL_HIGH' || card.eventKind === 'DUEL_LOW'
                  ? '⚔️'
                  : card.eventKind === 'SUPER_DUEL_HIGH' || card.eventKind === 'SUPER_DUEL_LOW'
                  ? '💥'
                  : card.eventKind === 'PASS_RIGHT'
                  ? '🫱'
                  : card.eventKind === 'RED_DRAW_2'
                  ? '♥♦'
                  : card.eventKind === 'BLACK_DRAW_2'
                  ? '♣♠'
                  : card.eventKind === 'ALL_DRAW_1'
                  ? '🃏'
                  : card.value === 13
                  ? '👑'
                  : card.value === 12
                  ? '👸'
                  : card.value === 11
                  ? '🗡️'
                  : card.value === 1
                  ? '🌊'
                  : suitMeta.symbol}
              </span>

              <span className={`text-xs font-black uppercase tracking-wider mt-1.5 ${suitMeta.neonText}`}>
                {suitMeta.name}
              </span>
            </div>

            {/* Angolo Bottom-Right (Rovesciato) */}
            <div className="flex items-center justify-end gap-1 leading-none rotate-180">
              <span className="text-2xl font-black text-white">
                {card.label}
              </span>
              <span className={`text-xl ${suitMeta.neonText}`}>
                {suitMeta.symbol}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TITOLO E SLOGAN DELLA CARTA */}
        <div className="text-center w-full mt-2 mb-3">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>{details.title}</span>
          </h3>
          <p className="text-xs font-bold text-amber-300 italic mt-0.5">
            &ldquo;{details.tagline}&rdquo;
          </p>
        </div>

        {/* 3. DESCRIZIONE EFFETTO E DETTAGLI */}
        <div className="w-full space-y-2.5 text-xs text-left mb-4">
          {/* Box Effetto Principale */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Cosa fa questa carta:</span>
            </span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {details.effect}
            </p>
          </div>

          {/* Difesa o Contromossa (se presente) */}
          {details.defenseInfo && (
            <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1 mb-0.5">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Come difendersi o contrastare:</span>
              </span>
              <p className="text-[11px] text-cyan-100 font-medium leading-relaxed">
                {details.defenseInfo}
              </p>
            </div>
          )}

          {/* Badge Colpo Finale & Curiosità */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-[11px]">
            <span className="text-slate-400 font-semibold">Regola Colpo Finale:</span>
            <span
              className={`font-black flex items-center gap-1 ${
                details.colpoFinaleValid ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {details.colpoFinaleValid ? (
                <>
                  <Crown className="w-3 h-3" />
                  <span>Valida per vincere (0 carte)</span>
                </>
              ) : (
                <span>🚫 Non puoi chiudere la partita</span>
              )}
            </span>
          </div>

          {/* Curiosità / Tip */}
          <p className="text-[10px] text-slate-400 italic text-center px-2">
            💡 {details.funFact}
          </p>
        </div>

        {/* 4. STATO DI GIOCABILITÀ & BOTTONE D'AZIONE */}
        {!isTopCard && onPlayCard && (
          <div className="w-full pt-2 border-t border-white/10">
            {isPlayable ? (
              <button
                type="button"
                onClick={() => {
                  onPlayCard(card);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-950/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {playability?.badgeLabel
                    ? `GIOCA: ${playability.badgeLabel}`
                    : 'GIOCA QUESTA CARTA'}
                </span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-center">
                <span className="text-xs font-bold text-amber-300 block">
                  ⏸️ Non giocabile in questo momento
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Deve avere lo stesso seme, stesso numero o valore ±1 rispetto alla carta a terra.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
