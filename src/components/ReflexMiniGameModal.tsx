'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ActiveReflexState } from '@/types/game';
import { playReflexAlertSound, playReflexFailSound, playReflexTapSound } from '@/lib/audioEffects';
import { triggerHapticFeedback } from '@/lib/hapticFeedback';
import { Flame, Skull, Sparkles, Target, Zap, Clock, Beer, AlertTriangle } from 'lucide-react';

interface ReflexMiniGameModalProps {
  reflex: ActiveReflexState | null;
  clientPlayerIndex: number;
  onTap: (playerIndex: number, tapTimeMs: number) => void;
  onTimeout: () => void;
  onDismiss: () => void;
}

export function ReflexMiniGameModal({
  reflex,
  clientPlayerIndex,
  onTap,
  onTimeout,
  onDismiss,
}: ReflexMiniGameModalProps) {
  const [timeLeftMs, setTimeLeftMs] = useState(2000);
  const startTimeRef = useRef<number>(Date.now());
  const hasHumanTapped = Boolean(
    reflex?.participants.find((p) => p.playerIndex === clientPlayerIndex)?.tapped
  );
  const timeoutCalledRef = useRef(false);
  const aiTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize start time, sound, and AI bot reactions
  useEffect(() => {
    if (!reflex || reflex.phase !== 'ACTIVE') return;

    startTimeRef.current = Date.now();
    timeoutCalledRef.current = false;
    playReflexAlertSound();
    triggerHapticFeedback('attack');

    // Simulate realistic AI reaction times
    aiTimeoutsRef.current.forEach(clearTimeout);
    aiTimeoutsRef.current = [];

    reflex.participants.forEach((p) => {
      if (p.isAI && !p.tapped) {
        // AI reaction time between 450ms and 1850ms, with 12% chance of exceeding 2000ms
        const willMiss = Math.random() < 0.12;
        const simulatedTime = willMiss
          ? Math.round(2050 + Math.random() * 400)
          : Math.round(480 + Math.random() * 1150);

        const timer = setTimeout(() => {
          if (simulatedTime <= 2000) {
            onTap(p.playerIndex, simulatedTime);
          }
        }, simulatedTime);
        aiTimeoutsRef.current.push(timer);
      }
    });

    // 2.0s Timer loop
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 2000 - elapsed);
      setTimeLeftMs(remaining);

      if (remaining === 0 && !timeoutCalledRef.current) {
        timeoutCalledRef.current = true;
        clearInterval(interval);
        onTimeout();
      }
    }, 25);

    return () => {
      clearInterval(interval);
      aiTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [reflex?.phase, reflex?.createdAt]);

  // Audio & Haptic feedback on resolution
  useEffect(() => {
    if (reflex?.phase === 'RESOLVED') {
      aiTimeoutsRef.current.forEach(clearTimeout);
      const isHumanLoser = reflex.loserIndex === clientPlayerIndex;
      if (isHumanLoser) {
        playReflexFailSound();
        triggerHapticFeedback('attack');
      }

      // Auto dismiss after 2.8s
      const timer = setTimeout(() => {
        onDismiss();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [reflex?.phase, reflex?.loserIndex, clientPlayerIndex, onDismiss]);

  if (!reflex) return null;

  const handleHumanTap = () => {
    if (hasHumanTapped || reflex.phase !== 'ACTIVE') return;
    const reactionTime = Date.now() - startTimeRef.current;
    playReflexTapSound();
    triggerHapticFeedback('turn');
    onTap(clientPlayerIndex, reactionTime);
  };

  const humanParticipant = reflex.participants.find((p) => p.playerIndex === clientPlayerIndex);
  const loserParticipant = reflex.participants.find((p) => p.playerIndex === reflex.loserIndex);
  const sortedParticipants = [...reflex.participants].sort((a, b) => {
    if (a.tapped && b.tapped) return (a.tapTimeMs || 0) - (b.tapTimeMs || 0);
    if (a.tapped) return -1;
    if (b.tapped) return 1;
    return 0;
  });

  const targetTop = Math.min(75, Math.max(22, reflex.targetCoords?.top ?? 50));
  const targetLeft = Math.min(85, Math.max(15, reflex.targetCoords?.left ?? 50));

  // =======================================================================
  // FASE ATTIVA: Bersaglio piccolo a schermo in posizione random, HUD in alto
  // =======================================================================
  if (reflex.phase === 'ACTIVE') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[95] select-none pointer-events-auto overflow-hidden animate-in fade-in duration-150"
      >
        {/* Sfondo soft / allarme con bagliore ambrato pulsante */}
        <div className="absolute inset-0 bg-yellow-950/20 backdrop-blur-[1px] pointer-events-none border-4 border-yellow-400/40 animate-pulse" />

        {/* HUD In Alto: Avviso rapido e barra conto alla rovescia 2.0s */}
        <div className="absolute top-2 inset-x-0 mx-auto max-w-xs sm:max-w-sm px-3 py-1.5 rounded-2xl bg-gradient-to-r from-yellow-500/95 via-amber-500/95 to-yellow-500/95 border-2 border-white shadow-[0_0_25px_rgba(250,204,21,0.8)] text-slate-950 flex flex-col items-center z-20 pointer-events-none animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between w-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <span className="flex items-center gap-1 text-slate-950">
              <Zap className="w-3.5 h-3.5 fill-slate-950 animate-bounce" />
              <span>RIFLESSI: TOCCA IL BERSAGLIO!</span>
            </span>
            <span className="flex items-center gap-1 font-mono font-black text-rose-950 bg-yellow-300/80 px-1.5 py-0.2 rounded border border-slate-950/20">
              <Clock className="w-3 h-3" />
              <span>{(timeLeftMs / 1000).toFixed(2)}s</span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950/40 overflow-hidden mt-1 p-0.5 border border-slate-950/20">
            <div
              className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-400 via-yellow-200 to-rose-600 shadow"
              style={{ width: `${(timeLeftMs / 2000) * 100}%` }}
            />
          </div>
        </div>

        {/* BERSAGLIO COMPATTO (Piccolo per richiedere colpo d'occhio e precisione) */}
        <div
          style={{
            top: `${targetTop}%`,
            left: `${targetLeft}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-30 flex flex-col items-center pointer-events-auto"
        >
          {/* Anelli pulsanti radar esterni */}
          {!hasHumanTapped && (
            <>
              <div className="absolute -inset-2.5 rounded-full border-2 border-yellow-400/70 animate-ping pointer-events-none" />
              <div className="absolute -inset-1 rounded-full border border-amber-300/80 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Pulsante Bersaglio Compatto */}
          <button
            type="button"
            disabled={hasHumanTapped}
            onClick={handleHumanTap}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.9)] transition-all duration-150 transform select-none cursor-pointer border-2 ${
              hasHumanTapped
                ? 'bg-emerald-600 border-white scale-95 shadow-[0_0_20px_#10b981]'
                : 'bg-gradient-to-tr from-yellow-500 via-amber-400 to-rose-500 hover:scale-110 active:scale-90 border-white animate-pulse'
            }`}
            title="Tocca il bersaglio!"
          >
            {hasHumanTapped ? (
              <span className="text-xl">✅</span>
            ) : (
              <Target className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 fill-yellow-200 stroke-[2.5]" />
            )}
          </button>

          {/* Badge fluttuante sotto al bersaglio */}
          {hasHumanTapped ? (
            <span className="mt-1 px-1.5 py-0.2 rounded-md bg-emerald-600/95 text-white text-[9px] font-black uppercase tracking-tight shadow border border-white/40 whitespace-nowrap animate-scaleIn">
              SALVO! {(humanParticipant?.tapTimeMs || 0)}ms
            </span>
          ) : (
            <span className="mt-1 px-1.5 py-0.2 rounded-md bg-slate-950/85 text-yellow-300 text-[8.5px] font-black uppercase tracking-wider shadow border border-yellow-400/40 whitespace-nowrap animate-bounce">
              QUI! 🎯
            </span>
          )}
        </div>
      </div>
    );
  }

  // =======================================================================
  // FASE RISOLTA: Podio, penitenza del più lento e classifica tempi
  // =======================================================================
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-[#251b04] via-[#150d02] to-[#0a0500] border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] p-4 text-slate-100 flex flex-col items-center overflow-hidden">
        {/* Warning Stripes Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#000_10px,#000_20px)] opacity-80" />

        {/* Header Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg mb-2 mt-1">
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          <span>MINI-GIOCO RIFLESSI: VERDETTO</span>
        </div>

        {/* RESULTS: PODIUM & PENALTY */}
        {loserParticipant && (
          <div className="w-full my-2 p-3 rounded-2xl bg-black/60 border-2 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.4)] flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-1 text-rose-400 font-black text-xs uppercase tracking-wider mb-1">
              <Skull className="w-4 h-4 animate-bounce" />
              <span>IL PIÙ LENTO È STATO:</span>
            </div>

            <span className="text-base sm:text-lg font-black text-white drop-shadow">
              {loserParticipant.playerName}
            </span>

            <div className="mt-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
              <Beer className="w-3.5 h-3.5" />
              <span>BEVE 1 SORSO 🍺 E PESCA 1 CARTA 🃏!</span>
            </div>

            {loserParticipant.playerIndex === clientPlayerIndex && (
              <span className="mt-1 text-[10px] font-black text-rose-300 animate-pulse">
                Hai perso la sfida di riflessi! 😅
              </span>
            )}
          </div>
        )}

        {/* LIVE PLAYERS STATUS / SCORES */}
        <div className="w-full mt-2 pt-2 border-t border-white/10 flex flex-col gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-yellow-300/80 text-center">
            Classifica Tempi di Reazione
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {sortedParticipants.map((p, idx) => {
              const isLoser = p.playerIndex === reflex.loserIndex;
              const isFastest = idx === 0 && p.tapped;
              const isMe = p.playerIndex === clientPlayerIndex;

              return (
                <div
                  key={p.playerIndex}
                  className={`px-2 py-1.5 rounded-xl border flex items-center justify-between text-[10px] font-bold ${
                    isLoser
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                      : isFastest
                      ? 'bg-amber-950/70 border-yellow-400 text-yellow-200'
                      : p.tapped
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-black/40 border-white/10 text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[75px] flex items-center gap-1">
                    {isMe ? '👉 Tu' : p.playerName}
                  </span>
                  <span className="shrink-0 font-black">
                    {isLoser ? (
                      <span className="text-rose-400">🐢 Ultimo</span>
                    ) : p.tapped ? (
                      <span className="text-emerald-300">{(p.tapTimeMs || 0)}ms</span>
                    ) : (
                      <span className="text-yellow-400 animate-pulse">⏳ Lento</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Button on Resolved */}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          Continua Partita
        </button>
      </div>
    </div>
  );
}
