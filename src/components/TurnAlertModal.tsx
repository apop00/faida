'use client';

import React, { useEffect, useState } from 'react';
import { Suit } from '@/types/game';
import { SUIT_INFO } from '@/lib/gameEngine';
import { ShieldAlert, Swords, Zap } from 'lucide-react';
import { playTurnSound } from '@/lib/audioEffects';

export interface TurnAlertData {
  playerName: string;
  suit: Suit;
  mode: 'NEUTRAL_FLOW' | 'ATTACK_CHAIN' | 'SPECIAL_EVENT';
  currentSips?: number;
}

interface TurnAlertModalProps {
  alert: TurnAlertData | null;
  onDismiss: () => void;
}

export function TurnAlertModal({ alert, onDismiss }: TurnAlertModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      playTurnSound();
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert || !visible) return null;

  const suitMeta = SUIT_INFO[alert.suit];
  const isAttackChain = alert.mode === 'ATTACK_CHAIN';
  const isSpecial = alert.mode === 'SPECIAL_EVENT';

  return (
    <div className="fixed top-11 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none animate-fadeIn transition-all duration-200">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-xl backdrop-blur-md ${
          isAttackChain
            ? 'bg-rose-950/90 border-rose-400 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
            : isSpecial
            ? 'bg-purple-950/90 border-purple-400 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
            : 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
        }`}
      >
        {isAttackChain ? (
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
        ) : isSpecial ? (
          <Zap className="w-4 h-4 text-purple-400 shrink-0" />
        ) : (
          <Swords className="w-4 h-4 text-cyan-400 shrink-0" />
        )}

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className={`text-xs font-black ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {isAttackChain ? 'SEI SOTTO ATTACCO!' : 'È IL TUO TURNO!'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-300 leading-tight">
            {isAttackChain
              ? `Difenditi (${alert.currentSips || 1}🍺 in palio) o Bevi!`
              : isSpecial
              ? 'Rispondi all\'evento speciale'
              : 'Lancia un attacco o cambia carta'}
          </span>
        </div>
      </div>
    </div>
  );
}
