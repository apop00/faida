'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ActiveDuelState } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { PlayingCard } from './PlayingCard';
import { playCardPlaySound, playDrinkSound } from '@/lib/audioEffects';
import { Beer, FastForward, Skull, Swords } from 'lucide-react';

interface DuelModalProps {
  activeDuel?: ActiveDuelState | null;
  onDismiss: () => void;
}

export function DuelModal({ activeDuel, onDismiss }: DuelModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isVerdictRevealed, setIsVerdictRevealed] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Sequential reveal animation step-by-step
  useEffect(() => {
    // Clear any existing timers
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    if (!activeDuel) {
      setRevealedCount(0);
      setIsVerdictRevealed(false);
      return;
    }

    setRevealedCount(0);
    setIsVerdictRevealed(false);

    const totalParticipants = activeDuel.participants.length;

    // Reveal each participant sequentially with a delay
    for (let i = 0; i < totalParticipants; i++) {
      const stepTimer = setTimeout(() => {
        setRevealedCount(i + 1);
        playCardPlaySound();
      }, 650 * (i + 1));
      timersRef.current.push(stepTimer);
    }

    // After all are revealed, brief pause then reveal verdict
    const finalTimer = setTimeout(() => {
      setIsVerdictRevealed(true);
      playDrinkSound();
    }, 650 * (totalParticipants + 1));
    timersRef.current.push(finalTimer);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [activeDuel]);

  if (!activeDuel) return null;

  const isSuper =
    activeDuel.duelKind === 'SUPER_DUEL_HIGH' ||
    activeDuel.duelKind === 'SUPER_DUEL_LOW';
  const isHigh =
    activeDuel.duelKind === 'DUEL_HIGH' ||
    activeDuel.duelKind === 'SUPER_DUEL_HIGH';

  const isTie = Boolean(activeDuel.isTie);
  const loserIndices =
    activeDuel.loserIndices && activeDuel.loserIndices.length > 0
      ? activeDuel.loserIndices
      : [activeDuel.loserIndex];

  const losers = activeDuel.participants
    .filter((p) => loserIndices.includes(p.player.id))
    .map((p) => p.player);

  const hasLocalUserLost = losers.some((p) => !p.isAI);

  const title = isSuper
    ? isHigh
      ? 'SUPER DUELLO CARTA ALTA 💥▲'
      : 'SUPER DUELLO CARTA BASSA 💥▼'
    : isHigh
    ? 'DUELLO 1v1 CARTA ALTA ⚔️▲'
    : 'DUELLO 1v1 CARTA BASSA ⚔️▼';

  const ruleDesc = isHigh
    ? 'Carta più ALTA vince (2–10): chi fa il numero più BASSO beve 2 sorsi! In caso di parità bevono tutti!'
    : 'Carta più BASSA vince (2–10): chi fa il numero più ALTO beve 2 sorsi! In caso di parità bevono tutti!';

  const handleSkipAnimation = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setRevealedCount(activeDuel.participants.length);
    setIsVerdictRevealed(true);
    playDrinkSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-3 select-none animate-fadeIn">
      <div className="w-full max-w-md sm:max-w-lg max-h-[96dvh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1f1038] via-[#130926] to-[#070311] border-2 border-amber-400/80 shadow-[0_0_60px_rgba(245,158,11,0.35)] p-3 sm:p-4 text-slate-100 flex flex-col items-center text-center my-auto relative">
        {/* Pulsante Chiudi Rapido (✕) in alto a destra per sicurezza totale */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-sm font-black cursor-pointer z-30 transition"
          title="Chiudi duello"
        >
          ✕
        </button>

        {/* Header Badge & Title Compatto */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
          <Swords className="w-3 h-3" />
          <span>{isSuper ? 'Sfida Generale (4 Giocatori)' : 'Duello d\'Onore 1v1'}</span>
        </div>

        <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium max-w-sm mt-0.5 mb-2 leading-tight">
          {ruleDesc}
        </p>

        {/* Duelists Cards Arena - Sequential Reveal con carte XS */}
        <div
          className={`w-full grid gap-1.5 sm:gap-2 mb-2 ${
            isSuper ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 max-w-xs'
          }`}
        >
          {activeDuel.participants.map(({ player, card }, idx) => {
            const suitMeta = SUIT_INFO[player.suit];
            const isThisRevealed = revealedCount > idx;
            const isThisLoser = isVerdictRevealed && loserIndices.includes(player.id);
            const isThisWinner = isVerdictRevealed && !loserIndices.includes(player.id);

            return (
              <div
                key={player.id}
                className={`flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border transition-all duration-300 ${
                  isThisLoser
                    ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)] scale-105'
                    : isThisWinner
                    ? 'bg-emerald-950/40 border-emerald-400/40'
                    : isThisRevealed
                    ? 'bg-[#1b1236] border-white/25 shadow-md'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Player Tag */}
                <div className="flex items-center gap-1 mb-1 w-full justify-center">
                  <span className={`text-xs ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
                  <span className="text-[10px] sm:text-[11px] font-black text-white truncate max-w-[80px]">
                    {player.name.replace('Bot ', '').replace(' 🤖', '')}
                  </span>
                </div>

                {/* Card Display with Step-by-Step Reveal (Size XS) */}
                <div className="my-0.5">
                  {isThisRevealed ? (
                    <div className="animate-scaleIn flex flex-col items-center">
                      <PlayingCard card={card} size="xs" />
                      <span className="mt-0.5 text-[9px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                        {card.value}
                      </span>
                    </div>
                  ) : (
                    <div className="w-[58px] h-[84px] rounded-lg bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-amber-400/30 flex flex-col items-center justify-center shadow-lg animate-pulse">
                      <span className="text-xl">🂠</span>
                      <span className="text-[8px] font-black text-amber-300 uppercase mt-0.5">
                        Estrae...
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-1 h-4 flex items-center justify-center">
                  {isVerdictRevealed ? (
                    isThisLoser ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase flex items-center gap-1 animate-bounce">
                        <Skull className="w-2.5 h-2.5" />
                        {isTie ? 'PARITÀ! 2🍺' : 'Beve 2🍺'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] font-black uppercase">
                        Salvo ✨
                      </span>
                    )
                  ) : isThisRevealed ? (
                    <span className="text-[8px] text-cyan-300 font-bold uppercase animate-fadeIn">
                      Rivelata!
                    </span>
                  ) : (
                    <span className="text-[8px] text-slate-400 font-bold uppercase animate-pulse">
                      In attesa...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Banner or Skip Animation Button Compatto */}
        {isVerdictRevealed ? (
          isTie ? (
            <div className="w-full rounded-xl bg-gradient-to-r from-purple-900/60 via-rose-900/60 to-amber-900/60 border border-amber-400 px-2.5 py-1.5 mb-2 flex items-center justify-between shadow-md animate-fadeIn">
              <div className="flex items-center gap-2 text-left min-w-0">
                <span className="text-base sm:text-lg">⚔️</span>
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase text-amber-300">
                    PARITÀ! BEVONO TUTTI 2🍺
                  </div>
                  <div className="text-[11px] font-black text-white truncate max-w-[240px]">
                    {losers.map((l) => l.name.replace('Bot ', '').replace(' 🤖', '')).join(' e ')}
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-black text-amber-300 shrink-0">+2🍺</span>
            </div>
          ) : (
            <div className="w-full rounded-xl bg-gradient-to-r from-rose-600/30 via-amber-600/30 to-purple-600/30 border border-rose-400/60 px-2.5 py-1.5 mb-2 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 text-left min-w-0">
                <span className="text-base sm:text-lg">🍺</span>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase text-rose-300">
                    Verdetto Duello
                  </div>
                  <div className="text-[11px] font-black text-white truncate max-w-[240px]">
                    {losers[0]?.name} perde il duello!
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-black text-amber-300 shrink-0">+{activeDuel.sipsToDrink}🍺</span>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={handleSkipAnimation}
            className="w-full py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase tracking-wider mb-2 cursor-pointer flex items-center justify-center gap-1 shadow active:scale-95 transition"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Rivela Tutto Subito! (Salta Animazione)</span>
          </button>
        )}

        {/* Action Button Compatto e Sempre Visibile */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Beer className="w-3.5 h-3.5" />
          <span>
            {isVerdictRevealed && hasLocalUserLost
              ? 'HO BEVUTO (2 Sorsi)! 🍻 Continua'
              : 'Ho Capito, Continua la Faida!'}
          </span>
        </button>
      </div>
    </div>
  );
}
