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
        className={`flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-xl border transition-all duration-300 min-w-0 ${
          isThisLoser
            ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-105 z-10'
            : isThisWinner
            ? 'bg-emerald-950/40 border-emerald-400/40'
            : isThisRevealed
            ? 'bg-[#1b1236] border-white/25 shadow-md'
            : isHuman && isChoosingPhase
            ? 'bg-purple-950/70 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-105 z-10'
            : 'bg-white/5 border-white/10'
        }`}
      >
        {/* Player Tag */}
        <div className="flex items-center gap-1 mb-0.5 w-full justify-center">
          <span className={`text-[11px] ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
          <span className="text-[10px] sm:text-[11px] font-black text-white truncate max-w-[70px]">
            {isHuman ? 'TU' : player.name.replace('Bot ', '').replace(' 🤖', '')}
          </span>
        </div>

        {/* Card Display */}
        <div className="my-0.5">
          {hasNoCard && !cardToDisplay ? (
            <div className="w-[60px] h-[86px] rounded-xl bg-rose-950/80 border-2 border-rose-500/60 flex flex-col items-center justify-center shadow-lg p-1 text-center animate-pulse">
              <span className="text-xl">💀</span>
              <span className="text-[8px] font-black text-rose-300 uppercase leading-tight mt-1">
                No Carte (2-10)
              </span>
              <span className="text-[7px] text-amber-300 font-bold leading-tight">
                Auto-Sconfitta
              </span>
            </div>
          ) : isChoosingPhase ? (
            isHuman ? (
              cardToDisplay ? (
                <div className="flex flex-col items-center animate-scaleIn">
                  <PlayingCard card={cardToDisplay} size="xs" />
                  <span className="mt-0.5 text-[8.5px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40 animate-pulse">
                    Tua Scelta
                  </span>
                </div>
              ) : (
                <div className="w-[60px] h-[86px] rounded-xl border-2 border-dashed border-amber-400/70 bg-purple-950/60 flex flex-col items-center justify-center shadow-lg animate-pulse p-1 text-center">
                  <span className="text-lg">❓</span>
                  <span className="text-[7.5px] font-black text-amber-300 uppercase leading-tight mt-0.5">
                    Tocca sotto per scegliere
                  </span>
                </div>
              )
            ) : (
              <div className="w-[60px] h-[86px] rounded-xl bg-gradient-to-br from-indigo-950 to-slate-950 border-2 border-amber-400/40 flex flex-col items-center justify-center shadow-lg animate-pulse">
                <span className="text-xl">🂠</span>
                <span className="text-[8px] font-black text-amber-300 uppercase mt-0.5">
                  Carta Pronta
                </span>
              </div>
            )
          ) : isThisRevealed ? (
            <div className="animate-scaleIn flex flex-col items-center">
              <PlayingCard card={cardToDisplay} size="xs" />
              <span className="mt-0.5 text-[9px] font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                Valore {cardToDisplay?.value}
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
          {isChoosingPhase ? (
            isHuman ? (
              <span className="text-[8px] font-black text-amber-300 uppercase animate-pulse">
                Scegli e conferma
              </span>
            ) : (
              <span className="text-[8px] font-bold text-slate-400 uppercase">
                Pronto ✓
              </span>
            )
          ) : isVerdictRevealed ? (
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
      <div className="w-full max-w-lg sm:max-w-xl max-h-[96vh] sm:max-h-[340px] rounded-2xl bg-gradient-to-b from-[#1f1038] via-[#130926] to-[#070311] border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)] p-2 sm:p-2.5 text-slate-100 flex flex-col justify-between my-auto relative">
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

        {/* Duelists Cards Arena */}
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

        {/* FASE SCELTA CARTA (CHOOSING): Il giocatore umano sceglie attivamente la carta da schierare */}
        {isChoosingPhase ? (
          <div className="w-full flex flex-col items-center gap-1.5 p-1.5 rounded-xl bg-purple-950/80 border-2 border-amber-400/70 shadow-[0_0_24px_rgba(245,158,11,0.3)] my-0.5 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-amber-300">
              <Swords className="w-3.5 h-3.5" />
              <span>Scegli quale carta (2-10) schierare nel duello:</span>
            </div>

            {eligibleCards.length === 0 ? (
              <div className="text-[9px] text-rose-300 font-bold py-1 text-center">
                Non hai carte numeriche (2-10) in mano! Perderai automaticamente 2🍺.
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap max-h-[95px] overflow-y-auto no-scrollbar py-0.5 w-full">
                {eligibleCards.map((c) => {
                  const isSelected = (selectedCardId ?? humanParticipant?.card?.id) === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCardId(c.id)}
                      className={`transition-all transform cursor-pointer rounded-xl flex flex-col items-center p-0.5 ${
                        isSelected
                          ? 'scale-110 ring-3 ring-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.9)] z-10 brightness-110 bg-amber-400/20'
                          : 'hover:scale-105 opacity-70 hover:opacity-100 border border-white/20 bg-black/40'
                      }`}
                    >
                      <PlayingCard card={c} size="xs" />
                      <span
                        className={`text-[8px] font-black uppercase mt-0.5 px-1 rounded ${
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
              className="w-full max-w-xs py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.7)] border-2 border-white hover:brightness-110 active:scale-95 transition cursor-pointer animate-pulse flex items-center justify-center gap-1.5 shrink-0"
            >
              <Swords className="w-4 h-4 text-slate-950" />
              <span>SCHIERA CARTA E DUELLA!</span>
            </button>
          </div>
        ) : (
          /* FASE RIVELAZIONE & VERDETTO (REVEALED): Banner Risultato + Bottone Fine */
          <div className="w-full flex flex-col gap-1 mt-0.5 shrink-0">
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
        )}
      </div>
    </div>
  );
}
