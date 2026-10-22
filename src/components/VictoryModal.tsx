'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { Beer, Crown, Flame, RotateCcw, Shield, Swords, Trophy } from 'lucide-react';

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

  // 🍺 Penitenza Finale: Chi ha ancora più carte in mano quando qualcuno chiude deve bere 1 Sorso Finale per ogni 2 carte rimaste in mano!
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
      // Fallback if canvas-confetti fails in headless test environments
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-3 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1d1136] to-[#080411] border-2 border-rose-500/60 shadow-[0_0_60px_rgba(244,63,94,0.4)] p-5 text-slate-100 my-auto">
        {/* Winner Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="relative mb-2">
            <PlayerAvatar suit={winner.suit} name={winner.name} size="lg" />
            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow border border-white">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-black uppercase tracking-widest">
            0 Carte in Mano • Colpo Finale
          </span>
          <h2 className="text-2xl font-black text-white mt-1.5">
            Trionfa {winner.name}!
          </h2>
          <p className={`text-xs font-bold ${winnerSuit.neonText} flex items-center gap-1.5 mt-0.5`}>
            <span>{winnerSuit.symbol}</span>
            <span>{winnerSuit.factionName} domina la Faida!</span>
            <span>{winnerSuit.symbol}</span>
          </p>
        </div>

        {/* Titoli Ufficiali della Serata (Grid 2x2) */}
        <div className="mb-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-1.5 px-1">
            🏅 Titoli Ufficiali della Serata
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* 🧽 La Spugna */}
            <div className="rounded-2xl bg-amber-500/15 border border-amber-400/40 p-2.5 flex items-center gap-2 shadow-sm">
              <PlayerAvatar suit={spugnaPlayer.suit} name={spugnaPlayer.name} size="sm" />
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-amber-300 leading-tight flex items-center gap-1">
                  <span>🧽</span>
                  <span>La Spugna</span>
                </div>
                <div className="text-xs font-black text-white truncate">
                  {spugnaPlayer.name.replace(' 🤖', '')}
                </div>
                <div className="text-[10px] font-bold text-amber-200">
                  {spugnaPlayer.sipsDrunk} sorsi
                </div>
              </div>
            </div>

            {/* 🗡️ Il Cecchino */}
            <div className="rounded-2xl bg-rose-500/15 border border-rose-400/40 p-2.5 flex items-center gap-2 shadow-sm">
              <PlayerAvatar suit={cecchinoPlayer.suit} name={cecchinoPlayer.name} size="sm" />
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-rose-300 leading-tight flex items-center gap-1">
                  <span>🗡️</span>
                  <span>Il Cecchino</span>
                </div>
                <div className="text-xs font-black text-white truncate">
                  {cecchinoPlayer.name.replace(' 🤖', '')}
                </div>
                <div className="text-[10px] font-bold text-rose-200">
                  {cecchinoPlayer.attacksLaunched || 0} attacchi
                </div>
              </div>
            </div>

            {/* 🛡️ Il Muro */}
            <div className="rounded-2xl bg-cyan-500/15 border border-cyan-400/40 p-2.5 flex items-center gap-2 shadow-sm">
              <PlayerAvatar suit={muroPlayer.suit} name={muroPlayer.name} size="sm" />
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-cyan-300 leading-tight flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Il Muro</span>
                </div>
                <div className="text-xs font-black text-white truncate">
                  {muroPlayer.name.replace(' 🤖', '')}
                </div>
                <div className="text-[10px] font-bold text-cyan-200">
                  {muroPlayer.defensesSucceeded || 0} parate
                </div>
              </div>
            </div>

            {/* 🍺 Penitenza Finale */}
            <div className="rounded-2xl bg-purple-500/20 border border-purple-400/50 p-2.5 flex items-center gap-2 shadow-sm">
              <PlayerAvatar suit={penitenzaPlayer.suit} name={penitenzaPlayer.name} size="sm" />
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase text-purple-300 leading-tight flex items-center gap-1">
                  <span>🍺</span>
                  <span>Penitenza</span>
                </div>
                <div className="text-xs font-black text-white truncate">
                  {penitenzaPlayer.name.replace(' 🤖', '')} ({maxRemainingCards}🃏)
                </div>
                <div className="text-[10px] font-extrabold text-amber-300">
                  +{penitenzaSips} {penitenzaSips === 1 ? 'Sorso' : 'Sorsi'}!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-1.5 mb-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
            Classifica Sorsi & Statistiche Fazioni (1🍺 finale ogni 2 carte rimaste)
          </div>
          {sortedBySips.map((p, rank) => {
            const sMeta = SUIT_INFO[p.suit];
            const isWin = p.id === winner.id;
            const isSpugna = p.id === spugnaPlayer.id && spugnaPlayer.sipsDrunk > 0;
            const isPenitenza =
              p.hand.length === maxRemainingCards && maxRemainingCards >= 2;
            const extraPenaltySips = isPenitenza ? Math.floor(p.hand.length / 2) : 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                  isWin
                    ? 'bg-emerald-950/40 border-emerald-400/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-slate-400 w-4">#{rank + 1}</span>
                  <PlayerAvatar suit={p.suit} name={p.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-black text-white truncate">
                        {p.name}
                      </span>
                      {isWin && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[8px] font-black uppercase flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Vincitore
                        </span>
                      )}
                      {isSpugna && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[8px] font-black uppercase">
                          🧽 Spugna
                        </span>
                      )}
                      {isPenitenza && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[8px] font-black uppercase">
                          +{extraPenaltySips}🍺 Penitenza
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2.5 mt-0.5">
                      <span>🃏 {p.hand.length} rimaste</span>
                      <span className="flex items-center gap-0.5">
                        <Swords className="w-2.5 h-2.5 text-rose-400" /> {p.attacksLaunched || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5 text-cyan-400" /> {p.defensesSucceeded || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-rose-400">{p.sipsDrunk}</span>
                  <span className="block text-[9px] text-slate-400 uppercase font-bold">
                    Sorsi 🍺
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nuova Faida (Rivincita)</span>
        </button>
      </div>
    </div>
  );
}
