'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Shield,
  Swords,
  Sparkles,
  Zap,
  Crown,
  Beer,
  X,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickGuideModal({ isOpen, onClose }: QuickGuideModalProps) {
  const [activeStep, setActiveStep] = useState<number>(0);

  if (!isOpen) return null;

  const slides = [
    // SCHERMATA 1: ATTACCARE E COLLEGARE
    {
      step: 1,
      badge: 'Fase 1 • La Base',
      badgeColor: 'bg-amber-400 text-slate-950',
      title: 'COME ATTACCARE E COLLEGARE',
      subtitle: 'Collega seme o numero alla carta a terra per giocare!',
      icon: <Swords className="w-5 h-5 text-amber-400" />,
      content: (
        <div className="flex flex-col gap-2.5">
          {/* Esempio Grafico Visivo */}
          <div className="p-3 rounded-2xl bg-black/50 border border-amber-400/30 flex items-center justify-around gap-2 shadow-inner">
            {/* Carta a terra */}
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black uppercase text-slate-400 mb-0.5">A Terra 📍</span>
              <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-rose-900 to-rose-950 border-2 border-rose-400 flex flex-col items-center justify-center shadow-lg">
                <span className="text-sm font-black text-white">7</span>
                <span className="text-base text-rose-400 leading-none">♥</span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />

            {/* Carte giocabili collegate */}
            <div className="flex items-center gap-1.5">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-emerald-400 mb-0.5">Stesso N°</span>
                <div className="w-11 h-15 rounded-xl bg-slate-900 border border-emerald-400 flex flex-col items-center justify-center shadow">
                  <span className="text-xs font-black text-white">7</span>
                  <span className="text-sm text-cyan-400 leading-none">♠</span>
                </div>
              </div>

              <span className="text-xs text-white/40 font-black">o</span>

              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-emerald-400 mb-0.5">Stesso Seme</span>
                <div className="w-11 h-15 rounded-xl bg-slate-900 border border-emerald-400 flex flex-col items-center justify-center shadow">
                  <span className="text-xs font-black text-white">4</span>
                  <span className="text-sm text-rose-400 leading-none">♥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regole Rapide */}
          <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-200">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">⚔️</span>
              <span><strong>Attacco di Fazione:</strong> Calando una carta del tuo seme scagli un attacco (1🍺) al giocatore successivo.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">💥</span>
              <span><strong>Coppia o Tris:</strong> Se giochi 2 o 3 carte dello stesso numero moltiplichi i sorsi (2🍺 o 3🍺)!</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">🔄</span>
              <span><strong>Se non hai carte giocabili:</strong> Pesca 1 carta dal mazzo e passa il turno.</span>
            </li>
          </ul>
        </div>
      ),
    },

    // SCHERMATA 2: DIFENDERSI E SCUDO
    {
      step: 2,
      badge: 'Fase 2 • Difesa & Reazioni',
      badgeColor: 'bg-cyan-400 text-slate-950',
      title: 'COME DIFENDERSI DAI SORSI',
      subtitle: 'Quando sei sotto attacco, non subire: rispondi al colpo!',
      icon: <Shield className="w-5 h-5 text-cyan-400" />,
      content: (
        <div className="flex flex-col gap-2.5">
          {/* Griglia Opzioni di Difesa */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-400/40 flex flex-col">
              <span className="font-black text-cyan-300 flex items-center gap-1">
                <span>🔄 Contrattacco (-1)</span>
              </span>
              <span className="text-slate-300 text-[9px] mt-0.5">
                Carta con valore -1 rispetto all&apos;attacco. Se usi il tuo seme raddoppi i sorsi (x2)!
              </span>
            </div>

            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-400/40 flex flex-col">
              <span className="font-black text-cyan-300 flex items-center gap-1">
                <span>↪️ Deviazione (+1)</span>
              </span>
              <span className="text-slate-300 text-[9px] mt-0.5">
                Carta con valore +1. Reindirizza l&apos;attacco al prossimo avversario!
              </span>
            </div>

            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-400/40 flex flex-col">
              <span className="font-black text-purple-300 flex items-center gap-1">
                <span>🛡️ Scudo Alto</span>
              </span>
              <span className="text-slate-300 text-[9px] mt-0.5">
                Carta del tuo stesso seme con valore PIÙ ALTO dell&apos;attacco a terra.
              </span>
            </div>

            <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-400/40 flex flex-col">
              <span className="font-black text-rose-300 flex items-center gap-1">
                <span>🚫 STOP / 🪞 Specchio</span>
              </span>
              <span className="text-slate-300 text-[9px] mt-0.5">
                Lo STOP azzera l&apos;attacco a 0 sorsi; lo Specchio rimanda i sorsi x2 al mittente!
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[10px] text-amber-200 flex items-center gap-1.5">
            <Beer className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Se non puoi difenderti, tocca il pulsante <strong>&ldquo;Incassa Sorsi&rdquo;</strong> per bere i sorsi e riprendere il gioco!</span>
          </div>
        </div>
      ),
    },

    // SCHERMATA 3: FIGURE, EVENTI E COLPO FINALE
    {
      step: 3,
      badge: 'Fase 3 • Strategia & Vittoria',
      badgeColor: 'bg-purple-400 text-slate-950',
      title: 'FIGURE, EVENTI & COLPO FINALE',
      subtitle: 'Le carte speciali e l’unica regola per vincere la Faida!',
      icon: <Crown className="w-5 h-5 text-purple-400" />,
      content: (
        <div className="flex flex-col gap-2">
          {/* Card Showcase Pillole */}
          <div className="grid grid-cols-2 gap-1.5 text-[9px] sm:text-[10px]">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <span className="text-sm">👑</span>
              <div>
                <strong className="text-amber-300 block">Re (K) & Regicidio</strong>
                <span className="text-slate-300 text-[8px]">Tutti bevono 1🍺 (o 5🍺 con Regicidio!)</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <span className="text-sm">👸</span>
              <div>
                <strong className="text-purple-300 block">Regina (Q)</strong>
                <span className="text-slate-300 text-[8px]">Fardello +2 carte (occhio alla Beffa del 6)</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <span className="text-sm">⚔️</span>
              <div>
                <strong className="text-rose-300 block">Duelli & Super Duello</strong>
                <span className="text-slate-300 text-[8px]">Sfida di carte 2-10: chi perde beve 2🍺!</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <div>
                <strong className="text-yellow-300 block">Riflessi da Tavolo</strong>
                <span className="text-slate-300 text-[8px]">Tocca lo schermo in 2s o bevi e pesca!</span>
              </div>
            </div>
          </div>

          {/* Regola Suprema Colpo Finale */}
          <div className="mt-1 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-2 border-amber-400 shadow-md flex items-center gap-2">
            <Crown className="w-7 h-7 text-amber-300 shrink-0 fill-amber-400 animate-bounce" />
            <div className="flex flex-col text-[10px] leading-tight">
              <span className="font-black text-amber-300 uppercase tracking-wider text-[11px]">
                Regola Colpo Finale 🏆
              </span>
              <span className="text-slate-100 font-medium mt-0.5">
                Per vincere devi restare con 0 carte chiudendo con un numero (2-10) o una difesa. Se giochi una carta Evento come ultima, dovrai pescare!
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentSlide = slides[activeStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-[#1b1035] via-[#100726] to-[#070213] border-2 border-purple-500/80 shadow-[0_0_60px_rgba(168,85,247,0.4)] p-4 text-slate-100 flex flex-col justify-between overflow-hidden relative cursor-default"
      >
        {/* Pulsante Chiudi in alto a destra */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer z-30 transition"
          title="Chiudi guida"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Step Badge */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${currentSlide.badgeColor} shadow`}
          >
            {currentSlide.badge}
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            {activeStep + 1} di {slides.length}
          </span>
        </div>

        {/* Titolo e icona */}
        <div className="flex items-center gap-2 mb-1 pr-6">
          <span className="p-1 rounded-xl bg-white/10 shrink-0">
            {currentSlide.icon}
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-none">
              {currentSlide.title}
            </h3>
            <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">
              {currentSlide.subtitle}
            </p>
          </div>
        </div>

        {/* Slide Body */}
        <div className="my-2 min-h-[220px] flex flex-col justify-center">
          {currentSlide.content}
        </div>

        {/* Navigazione Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
          {/* Indicatori a pallini */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  activeStep === idx
                    ? 'w-5 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                title={`Scheda ${idx + 1}`}
              />
            ))}
          </div>

          {/* Pulsanti Avanti / Indietro */}
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Indietro</span>
              </button>
            )}

            {activeStep < slides.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
              >
                <span>Avanti</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                <span>Ho Capito, Giochiamo!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
