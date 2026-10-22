'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ActiveDuelState, Card, Player } from '@/types/game';
import { isDuelNumericCard, SUIT_INFO } from '@/lib/gameEngine';
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

  const isSuper =
    activeDuel?.duelKind === 'SUPER_DUEL_HIGH' ||
    activeDuel?.duelKind === 'SUPER_DUEL_LOW';
  const isHigh =
    activeDuel?.duelKind === 'DUEL_HIGH' ||
    activeDuel?.duelKind === 'SUPER_DUEL_HIGH';

  const humanParticipant =
    activeDuel?.participants.find((p) => p.player.id === humanPlayer?.id) ||
    activeDuel?.participants.find((p) => !p.player.isAI);

  // Tutte le carte numeriche (2-10) disponibili per il giocatore umano (incluse quelle già schierate)
  const eligibleCards: Card[] = (() => {
    if (!humanPlayer) return [];
    const map = new Map<string, Card>();
    if (humanParticipant?.card && isDuelNumericCard(humanParticipant.card)) {
      map.set(humanParticipant.card.id, humanParticipant.card);
    }
    humanPlayer.hand.filter(isDuelNumericCard).forEach((c) => map.set(c.id, c));
    return Array.from(map.values()).sort((a, b) =>
      isHigh ? b.value - a.value : a.value - b.value
    );
  })();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    humanParticipant?.card?.id || eligibleCards[0]?.id || null
  );

  useEffect(() => {
    if (humanParticipant?.card?.id) {
      setSelectedCardId(humanParticipant.card.id);
    } else if (eligibleCards[0]?.id) {
      setSelectedCardId(eligibleCards[0].id);
    }
  }, [activeDuel?.initiatorIndex, activeDuel?.targetIndex]);

  // Animazione sequenziale di rivelazione SOLO quando activeDuel.phase === 'REVEALED'
  useEffect(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];

    if (!activeDuel || activeDuel.phase !== 'REVEALED') {
      setRevealedCount(0);
      setIsVerdictRevealed(false);
      return;
    }

    setRevealedCount(0);
    setIsVerdictRevealed(false);

    const totalParticipants = activeDuel.participants.length;

    // Rivelazione sequenziale con step di 450ms
    for (let i = 0; i < totalParticipants; i++) {
      const stepTimer = setTimeout(() => {
        setRevealedCount(i + 1);
        playCardPlaySound();
      }, 450 * (i + 1));
      timersRef.current.push(stepTimer);
    }

    // Al termine, piccolo stacco poi rivela il verdetto
    const finalTimer = setTimeout(() => {
      setIsVerdictRevealed(true);
      playDrinkSound();
    }, 450 * (totalParticipants + 1));
    timersRef.current.push(finalTimer);

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [activeDuel?.phase, activeDuel?.initiatorIndex, activeDuel?.targetIndex]);

  if (!activeDuel) return null;

  const isChoosingPhase = activeDuel.phase === 'CHOOSING';
  const isTie = Boolean(activeDuel.isTie);
  const loserIndices =
    activeDuel.loserIndices && activeDuel.loserIndices.length > 0
      ? activeDuel.loserIndices
      : [activeDuel.loserIndex];

  const losers = activeDuel.participants
    .filter((p) => loserIndices.includes(p.player.id))
    .map((p) => p.player);

  const hasLocalUserLost = losers.some((p) => p.id === humanPlayer?.id);

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

  const handleSkipAnimation = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
    setRevealedCount(activeDuel.participants.length);
    setIsVerdictRevealed(true);
    playDrinkSound();
  };

  const handleConfirmChoice = () => {
    const effId = selectedCardId ?? humanParticipant?.card?.id ?? eligibleCards[0]?.id;
    if (onCommitCard) {
      onCommitCard(effId);
    }
  };

  const currentSelectedCard =
    eligibleCards.find((c) => c.id === selectedCardId) || humanParticipant?.card || null;

  const renderDuelistBox = (
    item: { player: Player; card?: any; hasNoCard?: boolean },
    idx: number
  ) => {
    const { player, card, hasNoCard } = item;
    const isHuman = player.id === humanPlayer?.id;
    const suitMeta = SUIT_INFO[player.suit];
    const isThisRevealed = !isChoosingPhase && revealedCount > idx;
    const isThisLoser = !isChoosingPhase && isVerdictRevealed && loserIndices.includes(player.id);
    const isThisWinner = !isChoosingPhase && isVerdictRevealed && !loserIndices.includes(player.id);

    // Carta da mostrare: in fase choosing, per l'umano mostra la sua scelta corrente
    const cardToDisplay = isChoosingPhase && isHuman ? currentSelectedCard : card;

    return (
      <div
        key={player.id}
        className={`flex flex-col items-center justify-between p-0.5 sm:p-1 rounded-lg sm:rounded-xl border transition-all duration-300 min-w-0 ${
          isThisLoser
            ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-105 z-10'
            : isThisWinner
            ? 'bg-emerald-950/40 border-emerald-400/40'
            : isThisRevealed
            ? 'bg-[#1b1236] border-white/25 shadow-md'
            : isHuman && isChoosingPhase
            ? 'bg-purple-950/70 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105 z-10'
            : 'bg-white/5 border-white/10'
        }`}
      >
        {/* Player Tag */}
        <div className="flex items-center gap-0.5 mb-0.5 w-full justify-center">
          <span className={`text-[9.5px] ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
          <span className="text-[9px] sm:text-[10px] font-black text-white truncate max-w-[62px] sm:max-w-[70px]">
            {isHuman ? 'TU' : player.name.replace('Bot ', '').replace(' 🤖', '')}
          </span>
        </div>

        {/* Card Display */}
        <div className="my-0.5">
          {hasNoCard && !cardToDisplay ? (
            <div className="w-[46px] h-[66px] sm:w-[50px] sm:h-[70px] rounded-lg bg-rose-950/80 border-2 border-rose-500/60 flex flex-col items-center justify-center shadow p-0.5 text-center animate-pulse">
              <span className="text-base sm:text-lg">💀</span>
              <span className="text-[6.5px] font-black text-rose-300 uppercase leading-none mt-0.5">
                No Carte
              </span>
              <span className="text-[6px] text-amber-300 font-bold leading-none mt-0.5">
                Auto-Ko
              </span>
            </div>
          ) : isChoosingPhase ? (
            isHuman ? (
              cardToDisplay ? (
                <div className="flex flex-col items-center animate-scaleIn">
                  <PlayingCard card={cardToDisplay} size="2xs" />
                  <span className="mt-0.5 text-[7px] font-black text-amber-300 bg-amber-400/20 px-1 py-0.2 rounded border border-amber-400/40 animate-pulse">
                    Tua Scelta
                  </span>
                </div>
              ) : (
                <div className="w-[46px] h-[66px] sm:w-[50px] sm:h-[70px] rounded-lg border-2 border-dashed border-amber-400/70 bg-purple-950/60 flex flex-col items-center justify-center shadow animate-pulse p-0.5 text-center">
                  <span className="text-sm">❓</span>
                  <span className="text-[6.5px] font-black text-amber-300 uppercase leading-tight mt-0.5">
                    Tocca sotto
                  </span>
                </div>
              )
            ) : (
              <div className="w-[46px] h-[66px] sm:w-[50px] sm:h-[70px] rounded-lg bg-gradient-to-br from-indigo-950 to-slate-950 border border-amber-400/40 flex flex-col items-center justify-center shadow animate-pulse">
                <span className="text-base sm:text-lg">🂠</span>
                <span className="text-[7px] font-black text-amber-300 uppercase mt-0.5">
                  Pronta
                </span>
              </div>
            )
          ) : isThisRevealed ? (
            <div className="animate-scaleIn flex flex-col items-center">
              <PlayingCard card={cardToDisplay} size="2xs" />
              <span className="mt-0.5 text-[7.5px] font-black text-amber-300 bg-amber-400/20 px-1 py-0.2 rounded border border-amber-400/40">
                Valore {cardToDisplay?.value}
              </span>
            </div>
          ) : (
            <div className="w-[46px] h-[66px] sm:w-[50px] sm:h-[70px] rounded-lg bg-gradient-to-br from-indigo-950 to-slate-950 border border-amber-400/30 flex flex-col items-center justify-center shadow animate-pulse">
              <span className="text-base sm:text-lg">🂠</span>
              <span className="text-[7px] font-black text-amber-300 uppercase mt-0.5">
                Schiera...
              </span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-0.5 h-3.5 flex items-center justify-center">
          {isChoosingPhase ? (
            isHuman ? (
              <span className="text-[7px] font-black text-amber-300 uppercase animate-pulse">
                Scegli sotto
              </span>
            ) : (
              <span className="text-[7px] font-bold text-slate-400 uppercase">
                Pronto ✓
              </span>
            )
          ) : isVerdictRevealed ? (
            isThisLoser ? (
              <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white text-[7px] font-black uppercase flex items-center gap-0.5 animate-bounce">
                <Skull className="w-2 h-2" />
                {hasNoCard ? 'NO CARTA 2🍺' : isTie ? 'PARITÀ 2🍺' : 'Beve 2🍺'}
              </span>
            ) : (
              <span className="px-1 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[7px] font-black uppercase">
                Salvo ✨
              </span>
            )
          ) : isThisRevealed ? (
            <span className="text-[7px] text-cyan-300 font-bold uppercase animate-fadeIn">
              {hasNoCard ? 'No Carta!' : 'Rivelata!'}
            </span>
          ) : (
            <span className="text-[7px] text-slate-400 font-bold uppercase animate-pulse">
              In attesa...
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-1 sm:p-2 select-none animate-fadeIn">
      <div className="w-full max-w-sm sm:max-w-md max-h-[96vh] sm:max-h-[305px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#1f1038] via-[#130926] to-[#070311] border-2 border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.35)] p-1.5 sm:p-2 text-slate-100 flex flex-col justify-between my-auto relative overflow-hidden">
        {/* Header Bar Ultra-Compatto (Titolo + Regola + Chiudi) */}
        <div className="w-full flex items-center justify-between pb-0.5 mb-0.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[8px] font-black uppercase tracking-wider shrink-0">
              <Swords className="w-2.5 h-2.5" />
              <span>{isSuper ? 'Sfida Tutti' : '1v1'}</span>
            </div>
            <h2 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-tight truncate">
              {title}
            </h2>
            <span className="text-[8px] text-amber-200/80 hidden sm:inline truncate">
              • {ruleSummary}
            </span>
          </div>

          {/* Pulsante Chiudi Rapido (✕) in alto a destra */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-[10px] font-black cursor-pointer transition shrink-0 ml-1.5"
            title="Chiudi duello"
          >
            ✕
          </button>
        </div>

        {/* Duelists Cards Arena */}
        <div className="w-full my-auto py-0.5 flex items-center justify-center shrink-0">
          {isSuper ? (
            <div className="w-full grid grid-cols-4 gap-1 sm:gap-1.5 max-w-sm sm:max-w-md mx-auto">
              {activeDuel.participants.map((item, idx) => renderDuelistBox(item, idx))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 sm:gap-4 w-full max-w-xs mx-auto">
              {/* Partecipante 1 */}
              {renderDuelistBox(activeDuel.participants[0], 0)}

              {/* Emblema VS Centrale */}
              <div className="flex flex-col items-center justify-center px-0.5 shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.35)] animate-pulse">
                  <span className="text-[10px] sm:text-xs font-black text-amber-300 tracking-tighter">VS</span>
                </div>
                <span className="text-[7px] font-extrabold uppercase text-slate-400 mt-0.5">
                  {isHigh ? 'Carta Alta' : 'Carta Bassa'}
                </span>
              </div>

              {/* Partecipante 2 */}
              {renderDuelistBox(activeDuel.participants[1], 1)}
            </div>
          )}
        </div>

        {/* FASE SCELTA CARTA (CHOOSING): Il giocatore umano sceglie attivamente la carta da schierare */}
        {isChoosingPhase ? (
          <div className="w-full flex flex-col items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-purple-950/80 border border-amber-400/70 shadow-[0_0_16px_rgba(245,158,11,0.25)] my-0.5 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase text-amber-300">
              <Swords className="w-3 h-3" />
              <span>Scegli quale carta (2-10) schierare:</span>
            </div>

            {eligibleCards.length === 0 ? (
              <div className="text-[8px] text-rose-300 font-bold py-0.5 text-center">
                Non hai carte numeriche (2-10) in mano! Perderai 2🍺.
              </div>
            ) : (
              <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full px-0.5">
                {eligibleCards.map((c) => {
                  const isSelected = (selectedCardId ?? humanParticipant?.card?.id) === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCardId(c.id)}
                      className={`transition-all transform cursor-pointer rounded-lg flex flex-col items-center p-0.5 shrink-0 ${
                        isSelected
                          ? 'scale-105 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)] z-10 brightness-110 bg-amber-400/20'
                          : 'hover:scale-105 opacity-70 hover:opacity-100 border border-white/20 bg-black/40'
                      }`}
                    >
                      <PlayingCard card={c} size="2xs" />
                      <span
                        className={`text-[7px] font-black uppercase mt-0.5 px-1 rounded ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'text-slate-300 bg-black/60'
                        }`}
                      >
                        {c.value} {SUIT_INFO[c.suit].symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmChoice}
              className="w-full max-w-xs py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-white hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              <Swords className="w-3.5 h-3.5 text-slate-950" />
              <span>SCHIERA CARTA E DUELLA!</span>
            </button>
          </div>
        ) : (
          /* FASE RIVELAZIONE & VERDETTO (REVEALED): Banner Risultato + Bottone Fine */
          <div className="w-full flex flex-col gap-1 mt-0.5 shrink-0">
            {isVerdictRevealed ? (
              <div
                className={`w-full py-0.5 sm:py-1 px-2 rounded-lg flex items-center justify-between text-[9px] sm:text-[10px] font-black shadow-md ${
                  isTie
                    ? 'bg-purple-900/60 border border-amber-400/60 text-amber-300'
                    : 'bg-rose-950/70 border border-rose-500/60 text-white'
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  <span>{isTie ? '⚔️' : '🍺'}</span>
                  <span className="truncate">
                    {isTie
                      ? `PARITÀ! Bevono tutti 2🍺 (${losers.map((l) => l.name.replace('Bot ', '').replace(' 🤖', '')).join(', ')})`
                      : `${losers[0]?.name.replace('Bot ', '').replace(' 🤖', '')} perde il duello!`}
                  </span>
                </div>
                <span className="text-amber-300 shrink-0 font-black text-[10px] sm:text-xs ml-1.5">
                  +{isTie ? 2 : activeDuel.sipsToDrink}🍺
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSkipAnimation}
                className="w-full py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 font-extrabold text-[8px] sm:text-[8.5px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <FastForward className="w-2.5 h-2.5" />
                <span>Rivela Subito (Salta animazione)</span>
              </button>
            )}

            {/* Pulsante Principale Azione - Grande e Immediato */}
            <button
              type="button"
              onClick={onDismiss}
              className="w-full py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-md hover:brightness-110 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Beer className="w-3 h-3 text-amber-300" />
              <span>
                {isVerdictRevealed && hasLocalUserLost
                  ? 'HO BEVUTO (2 Sorsi)! 🍻 Continua'
                  : 'Ho Capito, Continua la Faida!'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
