'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ActiveDuelState, Player } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { PlayingCard } from './PlayingCard';
import { playCardPlaySound, playDrinkSound } from '@/lib/audioEffects';
import { Beer, FastForward, Skull, Swords } from 'lucide-react';

interface DuelModalProps {
  activeDuel?: ActiveDuelState | null;
  onDismiss: () => void;
  humanPlayer?: Player;
  onCommitCard?: (cardId?: string) => void;
}

export function DuelModal({ activeDuel, onDismiss, humanPlayer, onCommitCard }: DuelModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isVerdictRevealed, setIsVerdictRevealed] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Sequential reveal animation step-by-step
  useEffect(() => {
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
      }, 500 * (i + 1));
      timersRef.current.push(stepTimer);
    }

    // After all are revealed, brief pause then reveal verdict
    const finalTimer = setTimeout(() => {
      setIsVerdictRevealed(true);
      playDrinkSound();
    }, 500 * (totalParticipants + 1));
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
      ? 'SUPER DUELLO ALTO 💥▲'
      : 'SUPER DUELLO BASSO 💥▼'
    : isHigh
    ? 'DUELLO 1v1 CARTA ALTA ⚔️▲'
    : 'DUELLO 1v1 CARTA BASSA ⚔️▼';

  const ruleSummary = isHigh
    ? 'Carta più ALTA vince • Chi fa meno o non ha carte beve 2🍺'
    : 'Carta più BASSA vince • Chi fa di più o non ha carte beve 2🍺';

  const eligibleCards = humanPlayer
    ? humanPlayer.hand.filter((c) => !c.eventKind && c.value >= 2 && c.value <= 10)
    : [];
  const humanParticipant = activeDuel.participants.find((p) => !p.player.isAI);

  const handleSkipAnimation = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setRevealedCount(activeDuel.participants.length);
    setIsVerdictRevealed(true);
    playDrinkSound();
  };

  const renderDuelistBox = (
    item: { player: Player; card?: any; hasNoCard?: boolean },
    idx: number
  ) => {
    const { player, card, hasNoCard } = item;
    const suitMeta = SUIT_INFO[player.suit];
    const isThisRevealed = revealedCount > idx;
    const isThisLoser = isVerdictRevealed && loserIndices.includes(player.id);
    const isThisWinner = isVerdictRevealed && !loserIndices.includes(player.id);

    return (
      <div
        key={player.id}
        className={`flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-xl border transition-all duration-300 min-w-0 ${
          isThisLoser
            ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-105 z-10'
            : isThisWinner
            ? 'bg-emerald-950/40 border-emerald-400/40'
            : isThisRevealed
            ? 'bg-[#1b1236] border-white/25 shadow-md'
            : 'bg-white/5 border-white/10'
        }`}
      >
        {/* Player Tag */}
        <div className="flex items-center gap-1 mb-0.5 w-full justify-center">
          <span className={`text-[11px] ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
          <span className="text-[10px] sm:text-[11px] font-black text-white truncate max-w-[70px]">
            {player.name.replace('Bot ', '').replace(' 🤖', '')}
          </span>
        </div>

        {/* Card Display with Step-by-Step Reveal (Size XS) */}
        <div className="my-0.5">
          {hasNoCard || !card ? (
            <div className="w-[60px] h-[86px] rounded-xl bg-rose-950/80 border-2 border-rose-500/60 flex flex-col items-center justify-center shadow-lg p-1 text-center animate-pulse">
              <span className="text-xl">💀</span>
              <span className="text-[8px] font-black text-rose-300 uppercase leading-tight mt-1">
                Nessuna Carta
              </span>
              <span className="text-[7px] text-amber-300 font-bold leading-tight">
                Auto-Sconfitta
              </span>
            </div>
          ) : isThisRevealed ? (
            <div className="animate-scaleIn flex flex-col items-center">
              <PlayingCard card={card} size="xs" />
              <span className="mt-0.5 text-[9px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                Valore {card.value}
              </span>
            </div>
          ) : (
            <div className="w-[60px] h-[86px] rounded-xl bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-amber-400/30 flex flex-col items-center justify-center shadow-lg animate-pulse">
              <span className="text-xl">🂠</span>
              <span className="text-[8px] font-black text-amber-300 uppercase mt-0.5">
                Schiera...
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-0.5 h-4 flex items-center justify-center">
          {isVerdictRevealed ? (
            isThisLoser ? (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase flex items-center gap-0.5 animate-bounce">
                <Skull className="w-2.5 h-2.5" />
                {hasNoCard ? 'NO CARTA 2🍺' : isTie ? 'PARITÀ 2🍺' : 'Beve 2🍺'}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] font-black uppercase">
                Salvo ✨
              </span>
            )
          ) : isThisRevealed ? (
            <span className="text-[8px] text-cyan-300 font-bold uppercase animate-fadeIn">
              {hasNoCard ? 'Nessuna Carta!' : 'Rivelata!'}
            </span>
          ) : (
            <span className="text-[8px] text-slate-400 font-bold uppercase animate-pulse">
              In attesa...
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 select-none animate-fadeIn">
      <div className="w-full max-w-lg sm:max-w-xl max-h-[96vh] sm:max-h-[325px] rounded-2xl bg-gradient-to-b from-[#1f1038] via-[#130926] to-[#070311] border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)] p-2 sm:p-2.5 text-slate-100 flex flex-col justify-between my-auto relative">
        {/* Header Bar Ultra-Compatto (Titolo + Regola + Chiudi) */}
        <div className="w-full flex items-center justify-between pb-1 mb-0.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[9px] font-black uppercase tracking-wider shrink-0">
              <Swords className="w-3 h-3" />
              <span>{isSuper ? 'Sfida Tutti' : '1v1'}</span>
            </div>
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
              {title}
            </h2>
            <span className="text-[9px] text-amber-200/80 hidden sm:inline truncate">
              • {ruleSummary}
            </span>
          </div>

          {/* Pulsante Chiudi Rapido (✕) in alto a destra */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-black cursor-pointer transition shrink-0 ml-2"
            title="Chiudi duello"
          >
            ✕
          </button>
        </div>

        {/* Duelists Cards Arena - Adattata al landscape senza overflow */}
        <div className="w-full my-auto py-0.5 flex items-center justify-center shrink-0">
          {isSuper ? (
            <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 max-w-lg mx-auto">
              {activeDuel.participants.map((item, idx) => renderDuelistBox(item, idx))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 sm:gap-6 w-full max-w-sm mx-auto">
              {/* Partecipante 1 */}
              {renderDuelistBox(activeDuel.participants[0], 0)}

              {/* Emblema VS Centrale */}
              <div className="flex flex-col items-center justify-center px-1 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse">
                  <span className="text-xs sm:text-sm font-black text-amber-300 tracking-tighter">VS</span>
                </div>
                <span className="text-[8px] font-extrabold uppercase text-slate-400 mt-0.5">
                  {isHigh ? 'Carta Alta' : 'Carta Bassa'}
                </span>
              </div>

              {/* Partecipante 2 */}
              {renderDuelistBox(activeDuel.participants[1], 1)}
            </div>
          )}
        </div>

        {/* Scelta Carta per il Giocatore Umano (se ha opzioni numeriche in mano) */}
        {humanParticipant && eligibleCards.length > 1 && onCommitCard && (
          <div className="w-full py-1 px-2 rounded-xl bg-purple-950/70 border border-purple-400/40 my-0.5 flex items-center justify-between gap-1 shrink-0">
            <span className="text-[9px] font-black uppercase text-purple-200 shrink-0">
              Scegli tua Carta:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {eligibleCards.map((c) => {
                const isSelected = humanParticipant.card?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onCommitCard(c.id)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black transition cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow ring-1 ring-amber-400'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
                    }`}
                  >
                    {c.label}{SUIT_INFO[c.suit].symbol} (Val. {c.value})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer: Verdict Banner + Action Button Sempre Visibili Senza Scroll */}
        <div className="w-full flex flex-col gap-1 mt-1 shrink-0">
          {isVerdictRevealed ? (
            <div
              className={`w-full py-1 px-2.5 rounded-xl flex items-center justify-between text-xs font-black shadow-md ${
                isTie
                  ? 'bg-purple-900/60 border border-amber-400/60 text-amber-300'
                  : 'bg-rose-950/70 border border-rose-500/60 text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span>{isTie ? '⚔️' : '🍺'}</span>
                <span className="truncate text-[10px] sm:text-xs">
                  {isTie
                    ? `PARITÀ! Bevono tutti 2🍺 (${losers.map((l) => l.name.replace('Bot ', '').replace(' 🤖', '')).join(', ')})`
                    : `${losers[0]?.name.replace('Bot ', '').replace(' 🤖', '')} perde il duello!`}
                </span>
              </div>
              <span className="text-amber-300 shrink-0 font-black text-xs sm:text-sm ml-2">
                +{isTie ? 2 : activeDuel.sipsToDrink}🍺
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSkipAnimation}
              className="w-full py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 font-extrabold text-[9px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <FastForward className="w-3 h-3" />
              <span>Rivela Subito (Salta animazione)</span>
            </button>
          )}

          {/* Pulsante Principale Azione - Grande e Immediato */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Beer className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isVerdictRevealed && hasLocalUserLost
                ? 'HO BEVUTO (2 Sorsi)! 🍻 Continua'
                : 'Ho Capito, Continua la Faida!'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
