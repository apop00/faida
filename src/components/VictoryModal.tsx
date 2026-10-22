'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { Crown, RotateCcw } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface VictoryModalProps {
  players: Player[];
  winnerIndex: number;
  onPlayAgain: () => void;
}

export function VictoryModal({ players, winnerIndex, onPlayAgain }: VictoryModalProps) {
  const winner = players[winnerIndex] || players[0];
  const winnerSuit = SUIT_INFO[winner.suit];

  // Sort players by sipsDrunk descending
  const sortedBySips = [...players].sort((a, b) => b.sipsDrunk - a.sipsDrunk);
  const spugnaPlayer = sortedBySips[0];

  // 🗡️ Il Cecchino: Chi ha lanciato più attacchi
  const cecchinoPlayer = [...players].sort(
    (a, b) => (b.attacksLaunched || 0) - (a.attacksLaunched || 0)
  )[0];

  // 🛡️ Il Muro: Chi ha parato/deviato più attacchi
  const muroPlayer = [...players].sort(
    (a, b) => (b.defensesSucceeded || 0) - (a.defensesSucceeded || 0)
  )[0];

  // 🍺 Penitenza Finale: Chi ha ancora più carte in mano
  const maxRemainingCards = Math.max(...players.map((p) => p.hand.length));
  const penitenzaPlayer = [...players].sort((a, b) => b.hand.length - a.hand.length)[0];
  const penitenzaSips = Math.floor(maxRemainingCards / 2);

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4'],
      });
    } catch {
      // Fallback if canvas-confetti fails in headless environments
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-2 select-none animate-fadeIn">
      <div className="w-full max-w-xl sm:max-w-2xl max-h-[96vh] sm:max-h-[325px] rounded-3xl bg-gradient-to-b from-[#1d1136] to-[#080411] border-2 border-rose-500/60 shadow-[0_0_60px_rgba(244,63,94,0.4)] p-2.5 sm:p-3 text-slate-100 flex flex-col justify-between my-auto">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-stretch h-full">
          {/* COLONNA SINISTRA: Vincitore & Pulsante Rivincita (Sempre a portata di mano) */}
          <div className="sm:col-span-4 flex flex-col items-center justify-between text-center p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0">
            {/* Winner Badge & Avatar */}
            <div className="flex flex-col items-center my-auto">
              <div className="relative mb-1">
                <PlayerAvatar suit={winner.suit} name={winner.name} size="md" />
                <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 p-1 rounded-full shadow border border-white animate-bounce">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              </div>

              <span className="px-2 py-0.2 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[8px] font-black uppercase tracking-wider">
                Colpo Finale • 0 Carte
              </span>

              <h2 className="text-sm sm:text-base font-black text-white mt-1 leading-tight truncate max-w-[150px]">
                Trionfa {winner.name.replace('Bot ', '').replace(' 🤖', '')}!
              </h2>

              <p className={`text-[10px] font-extrabold ${winnerSuit.neonText} flex items-center gap-1 mt-0.5`}>
                <span>{winnerSuit.symbol}</span>
                <span>{winnerSuit.factionName}</span>
                <span>{winnerSuit.symbol}</span>
              </p>
            </div>

            {/* Pulsante Nuova Faida Sempre Visibile in Primo Piano */}
            <button
              type="button"
              onClick={onPlayAgain}
              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nuova Faida</span>
            </button>
          </div>

          {/* COLONNA DESTRA: Titoli Ufficiali Serata + Classifica Compatta */}
          <div className="sm:col-span-8 flex flex-col justify-between gap-1.5 h-full">
            {/* Titoli Ufficiali Serata (Grid 2x2 compatta) */}
            <div className="grid grid-cols-2 gap-1.5 shrink-0">
              {/* 🧽 La Spugna */}
              <div className="rounded-xl bg-amber-500/15 border border-amber-400/40 px-2 py-1 flex items-center gap-1.5 shadow-sm min-w-0">
                <span className="text-sm shrink-0">🧽</span>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase text-amber-300 leading-tight">La Spugna</div>
                  <div className="text-[10px] font-black text-white truncate">{spugnaPlayer.name.replace('Bot ', '').replace(' 🤖', '')}</div>
                  <div className="text-[9px] font-bold text-amber-200 leading-none">{spugnaPlayer.sipsDrunk} sorsi</div>
                </div>
              </div>

              {/* 🗡️ Il Cecchino */}
              <div className="rounded-xl bg-rose-500/15 border border-rose-400/40 px-2 py-1 flex items-center gap-1.5 shadow-sm min-w-0">
                <span className="text-sm shrink-0">🗡️</span>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase text-rose-300 leading-tight">Il Cecchino</div>
                  <div className="text-[10px] font-black text-white truncate">{cecchinoPlayer.name.replace('Bot ', '').replace(' 🤖', '')}</div>
                  <div className="text-[9px] font-bold text-rose-200 leading-none">{cecchinoPlayer.attacksLaunched || 0} attacchi</div>
                </div>
              </div>

              {/* 🛡️ Il Muro */}
              <div className="rounded-xl bg-cyan-500/15 border border-cyan-400/40 px-2 py-1 flex items-center gap-1.5 shadow-sm min-w-0">
                <span className="text-sm shrink-0">🛡️</span>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase text-cyan-300 leading-tight">Il Muro</div>
                  <div className="text-[10px] font-black text-white truncate">{muroPlayer.name.replace('Bot ', '').replace(' 🤖', '')}</div>
                  <div className="text-[9px] font-bold text-cyan-200 leading-none">{muroPlayer.defensesSucceeded || 0} parate</div>
                </div>
              </div>

              {/* 🍺 Penitenza */}
              <div className="rounded-xl bg-purple-500/20 border border-purple-400/50 px-2 py-1 flex items-center gap-1.5 shadow-sm min-w-0">
                <span className="text-sm shrink-0">🍺</span>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase text-purple-300 leading-tight">Penitenza ({maxRemainingCards}🃏)</div>
                  <div className="text-[10px] font-black text-white truncate">{penitenzaPlayer.name.replace('Bot ', '').replace(' 🤖', '')}</div>
                  <div className="text-[9px] font-extrabold text-amber-300 leading-none">+{penitenzaSips} sorsi</div>
                </div>
              </div>
            </div>

            {/* Classifica 4 Giocatori Compatta (4 righe snelle) */}
            <div className="flex flex-col gap-1 shrink-0">
              <div className="text-[8px] font-black uppercase tracking-wider text-slate-400 px-0.5 flex justify-between">
                <span>Classifica Fazioni</span>
                <span>Sorsi Totali</span>
              </div>
              {sortedBySips.map((p, rank) => {
                const sMeta = SUIT_INFO[p.suit];
                const isWin = p.id === winner.id;
                const isPenitenza = p.hand.length === maxRemainingCards && maxRemainingCards >= 2;
                const extraPenaltySips = isPenitenza ? Math.floor(p.hand.length / 2) : 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-2 py-1 rounded-xl border ${
                      isWin
                        ? 'bg-emerald-950/40 border-emerald-400/50 shadow-sm'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-black text-slate-400 w-3 shrink-0">#{rank + 1}</span>
                      <span className={`text-xs ${sMeta.neonText} shrink-0`}>{sMeta.symbol}</span>
                      <span className="text-[11px] font-black text-white truncate max-w-[120px]">
                        {p.name.replace('Bot ', '').replace(' 🤖', '')}
                      </span>
                      {isWin && (
                        <span className="px-1 py-0.2 rounded bg-emerald-500 text-slate-950 text-[7px] font-black uppercase shrink-0">
                          Vinto 👑
                        </span>
                      )}
                      {isPenitenza && (
                        <span className="px-1 py-0.2 rounded bg-purple-500 text-white text-[7px] font-black uppercase shrink-0">
                          +{extraPenaltySips}🍺
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-slate-400">🃏{p.hand.length}</span>
                      <span className="text-xs font-black text-rose-400 min-w-[28px] text-right">
                        {p.sipsDrunk}🍺
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
