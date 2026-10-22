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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 select-none animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#1f1038] via-[#130926] to-[#070311] border-2 border-amber-400/80 shadow-[0_0_80px_rgba(245,158,11,0.35)] p-4 sm:p-5 text-slate-100 flex flex-col items-center text-center my-auto">
        {/* Header Badge & Title */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-2">
          <Swords className="w-3.5 h-3.5" />
          <span>{isSuper ? 'Sfida Generale con Tutti (4 Giocatori)' : 'Duello d\'Onore 1 contro 1'}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-slate-300 font-medium max-w-sm mt-1 mb-4 leading-relaxed">
          {ruleDesc}
        </p>

        {/* Duelists Cards Arena - Sequential Reveal */}
        <div
          className={`w-full grid gap-2.5 mb-4 ${
            isSuper ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'
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
                className={`flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                  isThisLoser
                    ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.5)] scale-105'
                    : isThisWinner
                    ? 'bg-emerald-950/40 border-emerald-400/40'
                    : isThisRevealed
                    ? 'bg-[#1b1236] border-white/25 shadow-md'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Player Tag */}
                <div className="flex items-center gap-1 mb-1.5 w-full justify-center">
                  <span className={`text-sm ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
                  <span className="text-[11px] font-black text-white truncate max-w-[85px]">
                    {player.name.replace('Bot ', '').replace(' 🤖', '')}
                  </span>
                </div>

                {/* Card Display with Step-by-Step Reveal */}
                <div className="my-1">
                  {isThisRevealed ? (
                    <div className="animate-scaleIn flex flex-col items-center">
                      <PlayingCard card={card} size="sm" />
                      <span className="mt-1 text-[11px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/40">
                        {card.value}
                      </span>
                    </div>
                  ) : (
                    <div className="w-[74px] h-[104px] rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-amber-400/30 flex flex-col items-center justify-center shadow-lg animate-pulse">
                      <span className="text-2xl">🂠</span>
                      <span className="text-[9px] font-black text-amber-300 uppercase mt-1">
                        Estrae...
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-1.5 h-5 flex items-center justify-center">
                  {isVerdictRevealed ? (
                    isThisLoser ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase flex items-center gap-1 animate-bounce">
                        <Skull className="w-2.5 h-2.5" />
                        {isTie ? 'PARITÀ! 2🍺' : 'Beve 2🍺'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase">
                        Salvo ✨
                      </span>
                    )
                  ) : isThisRevealed ? (
                    <span className="text-[9px] text-cyan-300 font-bold uppercase animate-fadeIn">
                      Rivelata!
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-bold uppercase animate-pulse">
                      In attesa...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Banner or Skip Animation Button */}
        {isVerdictRevealed ? (
          isTie ? (
            <div className="w-full rounded-2xl bg-gradient-to-r from-purple-900/60 via-rose-900/60 to-amber-900/60 border-2 border-amber-400 p-3 mb-4 flex items-center justify-between shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-fadeIn">
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-xl shadow-md font-black shrink-0">
                  ⚔️
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                    PARITÀ! BEVONO IN {losers.length}!
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white truncate max-w-[280px]">
                    {losers.map((l) => l.name.replace('Bot ', '').replace(' 🤖', '')).join(' e ')}
                  </div>
                  <div className="text-[10px] text-amber-200/90 font-medium">
                    Stesso valore! Bevono tutti 2 sorsi a testa!
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl font-black text-amber-300">+2🍺</span>
                <span className="block text-[8px] font-black uppercase text-slate-300">A Testa</span>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-gradient-to-r from-rose-600/30 via-amber-600/30 to-purple-600/30 border border-rose-400/60 p-3 mb-4 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5 text-left min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-xl shadow-md shrink-0">
                  🍺
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase text-rose-300">
                    Verdetto Ufficiale del Duello
                  </div>
                  <div className="text-sm font-black text-white truncate max-w-[280px]">
                    {losers[0]?.name} perde il duello!
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xl font-black text-amber-300">+{activeDuel.sipsToDrink}🍺</span>
                <span className="block text-[8px] font-black uppercase text-slate-300">Da Bere</span>
              </div>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={handleSkipAnimation}
            className="w-full py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider mb-4 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-400/20 active:scale-95 transition"
          >
            <FastForward className="w-4 h-4" />
            <span>Rivela Tutto Subito! (Salta Animazione)</span>
          </button>
        )}

        {/* Action Button */}
        <button
          type="button"
          disabled={!isVerdictRevealed}
          onClick={onDismiss}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 active:scale-[0.98] transition"
        >
          <Beer className="w-4 h-4" />
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
