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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-2xl max-h-[94vh] sm:max-h-[340px] rounded-3xl bg-[#130b24] border-2 border-white/20 p-3 sm:p-4 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative flex flex-col overflow-hidden">
        {/* Pulsante Chiudi in alto a destra */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90 z-30"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        {/* CONTENITORE A 2 COLONNE (ORIZZONTALE / LANDSCAPE FRIENDLY) */}
        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto sm:overflow-hidden no-scrollbar">
          {/* COLONNA SINISTRA: CARTA INGRANDITA + STATO + BOTTONE GIOCA */}
          <div className="w-full sm:w-[170px] shrink-0 flex flex-col items-center justify-between">
            {/* Badge Contesto */}
            <div className="flex items-center gap-1.5 mb-1.5 w-full justify-center">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  isTopCard
                    ? 'bg-amber-400 text-slate-950 border border-amber-300'
                    : 'bg-white/10 text-slate-300 border border-white/15'
                }`}
              >
                {isTopCard ? '📍 A TERRA' : '🃏 IN MANO'}
              </span>

              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${details.categoryColor}`}
              >
                {details.category}
              </span>
            </div>

            {/* Visual della Carta Ingrandita */}
            <div className="relative my-auto">
              {/* Alone luminoso colorato */}
              <div
                className={`absolute -inset-1.5 rounded-2xl blur-lg opacity-60 pointer-events-none ${
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
                className={`relative w-28 h-40 sm:w-32 sm:h-44 rounded-2xl bg-[#191131] border-3 ${suitMeta.neonBorder} shadow-2xl flex flex-col justify-between p-2 select-none`}
              >
                {/* Angolo Top-Left */}
                <div className="flex items-center gap-1 leading-none">
                  <span className="text-lg sm:text-xl font-black text-white">
                    {card.label}
                  </span>
                  <span className={`text-base sm:text-lg ${suitMeta.neonText}`}>
                    {suitMeta.symbol}
                  </span>
                </div>

                {/* Centro della Carta */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <span className="text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-none">
                    {card.eventKind === 'DIRECT_SIPS'
                      ? `${card.sipsAmount}🍺`
                      : card.eventKind === 'MIRROR'
                      ? '🪞'
                      : card.eventKind === 'STOP_SUIT'
                      ? '🚫'
                      : card.eventKind === 'SKIP_TURN'
                      ? '⏭️'
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

                  <span className={`text-[10px] font-black uppercase tracking-wider mt-1 ${suitMeta.neonText}`}>
                    {suitMeta.name}
                  </span>
                </div>

                {/* Angolo Bottom-Right (Rovesciato) */}
                <div className="flex items-center justify-end gap-1 leading-none rotate-180">
                  <span className="text-lg sm:text-xl font-black text-white">
                    {card.label}
                  </span>
                  <span className={`text-base sm:text-lg ${suitMeta.neonText}`}>
                    {suitMeta.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottone d'Azione Gioca o Stato sotto la carta */}
            {!isTopCard && onPlayCard && (
              <div className="w-full mt-2">
                {isPlayable ? (
                  <button
                    type="button"
                    onClick={() => {
                      onPlayCard(card);
                      onClose();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-950/60 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span className="truncate">
                      {playability?.badgeLabel
                        ? `GIOCA: ${playability.badgeLabel}`
                        : 'GIOCA CARTA'}
                    </span>
                  </button>
                ) : (
                  <div className="py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-400/30 text-center w-full">
                    <span className="text-[10px] font-bold text-amber-300 block leading-tight">
                      ⏸️ Non giocabile
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLONNA DESTRA: TITOLO, SLOGAN, DESCRIZIONE EFFETTO & CONTROMOSSE */}
          <div className="flex-1 min-w-0 flex flex-col justify-between overflow-y-auto pr-1 no-scrollbar space-y-2">
            {/* Header del Dettaglio */}
            <div className="border-b border-white/10 pb-1.5 pr-8">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5 leading-snug">
                <span>{details.title}</span>
              </h3>
              <p className="text-[11px] font-bold text-amber-300 italic mt-0.5">
                &ldquo;{details.tagline}&rdquo;
              </p>
            </div>

            {/* Box Effetto Principale */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1 mb-0.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Cosa fa questa carta:</span>
              </span>
              <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-medium">
                {details.effect}
              </p>
            </div>

            {/* Difesa o Contromossa (se presente) */}
            {details.defenseInfo && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1 mb-0.5">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Come difendersi o contrastare:</span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-cyan-100 font-medium leading-relaxed">
                  {details.defenseInfo}
                </p>
              </div>
            )}

            {/* Regola Colpo Finale & Curiosità */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 p-2 rounded-xl bg-white/5 border border-white/10 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-semibold">Colpo Finale:</span>
                <span
                  className={`font-black flex items-center gap-0.5 ${
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

              <span className="text-[9px] text-slate-400 italic">
                💡 {details.funFact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
