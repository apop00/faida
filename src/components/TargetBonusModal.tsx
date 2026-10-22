'use client';

import React, { useState } from 'react';
import { Card, Player } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { PlayingCard } from './PlayingCard';
import { Crosshair, Minus, Plus, X, Zap } from 'lucide-react';

interface TargetBonusModalProps {
  bonusCards: Card[];
  activePlayer: Player;
  players: Player[];
  targetCard: Card;
  onConfirm: (cardId: string, sipDistribution: { [playerIndex: number]: number }) => void;
  onClose: () => void;
}

export function TargetBonusModal({
  bonusCards,
  activePlayer,
  players,
  targetCard,
  onConfirm,
  onClose,
}: TargetBonusModalProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(bonusCards[0]?.id || '');
  const opponents = players.filter((p) => p.id !== activePlayer.id);
  const [distribution, setDistribution] = useState<{ [playerIndex: number]: number }>(() => ({
    [opponents[0]?.id ?? 1]: 3,
  }));

  const totalAssigned = Object.values(distribution).reduce((a, b) => a + b, 0);
  const remaining = 3 - totalAssigned;

  const adjustSips = (playerId: number, delta: number) => {
    setDistribution((prev) => {
      const current = prev[playerId] || 0;
      const nextVal = Math.max(0, Math.min(3, current + delta));
      const diff = nextVal - current;
      if (diff > 0 && remaining <= 0) return prev;
      return { ...prev, [playerId]: nextVal };
    });
  };

  const assignAllTo = (playerId: number) => {
    setDistribution({ [playerId]: 3 });
  };

  const splitEvenly = () => {
    const next: { [playerIndex: number]: number } = {};
    opponents.forEach((opp) => {
      next[opp.id] = 1;
    });
    setDistribution(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="w-full max-w-lg max-h-[94vh] sm:max-h-[330px] overflow-y-auto no-scrollbar rounded-3xl bg-gradient-to-b from-[#1a1030] to-[#090514] border-2 border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.35)] p-3 sm:p-3.5 text-slate-100 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer z-30 transition"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-amber-400 font-black text-[10px] uppercase tracking-widest mb-0.5">
          <Crosshair className="w-3.5 h-3.5" />
          <span>Azione Rapida Gratuita</span>
        </div>
        <h3 className="text-base sm:text-lg font-black text-white leading-tight">
          Bonus Carta Bersaglio ({targetCard.label})
        </h3>
        <p className="text-[11px] text-slate-300 mt-0.5">
          Scarta il tuo <strong className="text-amber-300">{targetCard.label}</strong> per distribuire subito{' '}
          <strong className="text-amber-300">3 sorsi</strong> agli avversari. Non consuma il turno!
        </p>

        {/* Choose which matching card to discard if multiple */}
        <div className="flex justify-center gap-2.5 my-2">
          {bonusCards.map((c) => (
            <PlayingCard
              key={c.id}
              card={c}
              size="sm"
              interactive
              selected={c.id === selectedCardId}
              onClick={() => setSelectedCardId(c.id)}
            />
          ))}
        </div>

        {/* Quick presets */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold text-slate-400">
            Da assegnare:{' '}
            <strong className={remaining === 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {remaining} sorsi
            </strong>
          </span>
          <button
            type="button"
            onClick={splitEvenly}
            className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500/30 cursor-pointer"
          >
            1 Sorso a Tutti (1-1-1)
          </button>
        </div>

        {/* Opponent Sip Selector */}
        <div className="space-y-1.5 mb-2.5">
          {opponents.map((opp) => {
            const suitMeta = SUIT_INFO[opp.suit];
            const count = distribution[opp.id] || 0;
            return (
              <div
                key={opp.id}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-base ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{opp.name}</div>
                    <div className="text-[9px] text-slate-400">
                      Bevuti: {opp.sipsDrunk} 🍺
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => assignAllTo(opp.id)}
                    className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black cursor-pointer hover:bg-rose-500/30"
                  >
                    Tutti (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSips(opp.id, -1)}
                    disabled={count <= 0}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-black text-amber-400 text-xs">
                    {count}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustSips(opp.id, 1)}
                    disabled={remaining <= 0}
                    className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={remaining !== 0 || !selectedCardId}
          onClick={() => onConfirm(selectedCardId, distribution)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Scarta e Assegna 3 Sorsi</span>
        </button>
      </div>
    </div>
  );
}
