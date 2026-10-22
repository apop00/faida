'use client';

import React, { useEffect, useState } from 'react';
import {
  Beer,
  Bell,
  BellOff,
  BookOpen,
  Bot,
  Edit2,
  Flame,
  Globe,
  Layers,
  Play,
  QrCode,
  Sparkles,
  Swords,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Card, MatchPreset } from '@/types/game';
import { SUITS, SUIT_INFO } from '@/lib/gameEngine';
import { backgroundMusic } from '@/lib/backgroundMusic';
import { sfxManager } from '@/lib/audioEffects';
import { RulesModal } from './RulesModal';
import { PlayingCard } from './PlayingCard';
import { CardDetailModal } from './CardDetailModal';

interface HomeScreenProps {
  onStartQuickGame: (nickname: string) => void;
  onOpenOnline: (nickname: string) => void;
  onStartLocalPreset: (
    preset: MatchPreset,
    names: string[],
    flags: boolean[]
  ) => void;
}

const PRESET_OPTIONS: {
  id: MatchPreset;
  title: string;
  subtitle: string;
  badge: string;
  flags: boolean[];
}[] = [
  {
    id: '1P_3PC',
    title: '1 Giocatore vs 3 PC',
    subtitle: 'Tu (Cuori ♥) contro 3 Bot PC reattivi',
    badge: 'RAPIDO',
    flags: [false, true, true, true],
  },
  {
    id: '2P_2PC',
    title: '2 Giocatori + 2 PC',
    subtitle: '2 Umani (♥, ♦) e 2 Bot PC (♣, ♠)',
    badge: 'DUO',
    flags: [false, false, true, true],
  },
  {
    id: '3P_1PC',
    title: '3 Giocatori + 1 PC',
    subtitle: '3 Umani (♥, ♦, ♣) e 1 Bot PC (♠)',
    badge: 'TRIO',
    flags: [false, false, false, true],
  },
  {
    id: '4P_0PC',
    title: '4 Giocatori Umani',
    subtitle: 'Tutti e 4 i semi guidati da amici al tavolo',
    badge: 'PARTY 4P',
    flags: [false, false, false, false],
  },
];

const SHOWCASE_CARDS: Card[] = [
  { id: 'sc-reverse', suit: 'diamonds', value: 0, label: '🔄', eventKind: 'REVERSE_SUIT' },
  { id: 'sc-stop', suit: 'clubs', value: 0, label: '🚫', eventKind: 'STOP_SUIT' },
  { id: 'sc-draw2', suit: 'hearts', value: 0, label: '+2', eventKind: 'RED_DRAW_2' },
  { id: 'sc-mirror', suit: 'spades', value: 0, label: '🪞', eventKind: 'MIRROR' },
  { id: 'sc-tax', suit: 'diamonds', value: 0, label: '📉', eventKind: 'TAX_RICH' },
  { id: 'sc-duel', suit: 'hearts', value: 0, label: '⚔️▲', eventKind: 'DUEL_HIGH' },
  { id: 'sc-k', suit: 'hearts', value: 13, label: 'K' },
  { id: 'sc-q', suit: 'spades', value: 12, label: 'Q' },
  { id: 'sc-j', suit: 'clubs', value: 11, label: 'J' },
  { id: 'sc-a', suit: 'diamonds', value: 1, label: 'A' },
];

export function HomeScreen({
  onStartQuickGame,
  onOpenOnline,
  onStartLocalPreset,
}: HomeScreenProps) {
  const [nickname, setNickname] = useState('Giocatore 1');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showLocalModal, setShowLocalModal] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isSfxOn, setIsSfxOn] = useState(true);

  useEffect(() => {
    setIsMusicOn(backgroundMusic.isMusicEnabled());
    const unsubMusic = backgroundMusic.subscribe((enabled) => setIsMusicOn(enabled));

    setIsSfxOn(sfxManager.isSfxEnabled());
    const unsubSfx = sfxManager.subscribe((enabled) => setIsSfxOn(enabled));

    return () => {
      unsubMusic();
      unsubSfx();
    };
  }, []);

  // Local preset configuration state
  const [selectedPreset, setSelectedPreset] = useState<MatchPreset>('1P_3PC');
  const [localNames, setLocalNames] = useState<string[]>([
    'Giocatore 1',
    'Bot Quadri 🤖',
    'Bot Fiori 🤖',
    'Bot Picche 🤖',
  ]);
  const [localAiFlags, setLocalAiFlags] = useState<boolean[]>([
    false,
    true,
    true,
    true,
  ]);

  // Load saved nickname from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('cb_nickname');
    if (saved && saved.trim()) {
      setNickname(saved.trim());
      setLocalNames((prev) => [saved.trim(), prev[1], prev[2], prev[3]]);
    }
  }, []);

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('cb_nickname', val);
    }
    setLocalNames((prev) => [val || 'Giocatore 1', prev[1], prev[2], prev[3]]);
  };

  const handleSelectPreset = (preset: MatchPreset) => {
    setSelectedPreset(preset);
    const target = PRESET_OPTIONS.find((p) => p.id === preset);
    if (!target) return;

    setLocalAiFlags(target.flags);
    setLocalNames([
      nickname || 'Giocatore 1',
      target.flags[1] ? 'Bot Quadri 🤖' : 'Giocatore 2',
      target.flags[2] ? 'Bot Fiori 🤖' : 'Giocatore 3',
      target.flags[3] ? 'Bot Picche 🤖' : 'Giocatore 4',
    ]);
  };

  const handleConfirmLocalStart = () => {
    setShowLocalModal(false);
    onStartLocalPreset(selectedPreset, localNames, localAiFlags);
  };

  return (
    <div className="h-full w-full flex flex-col justify-between bg-gradient-to-b from-[#080312] via-[#0d061c] to-[#06020c] text-slate-100 select-none overflow-hidden px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-2 pb-1.5">
      {/* 1. TOP BAR COMPATTA (Brand + Profilo Giocatore + Regole) */}
      <header className="flex items-center justify-between gap-2 shrink-0 h-10 px-1 border-b border-white/10">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-950/60 shrink-0">
            <Beer className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-sm truncate">
                COLPO BASSO
              </span>
              <span className="text-xs text-amber-400">🍺</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-rose-300 truncate">
              Faida di Semi • Drinking Game
            </span>
          </div>
        </div>

        {/* Profilo Nickname + Regolamento */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#180f2e] border border-white/20 shadow-inner group focus-within:border-cyan-400 transition">
            <span className="text-xs text-rose-400 font-bold shrink-0">♥</span>
            <input
              id="home-nickname-input"
              type="text"
              value={nickname}
              maxLength={14}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="Il tuo nome..."
              className="bg-transparent text-xs font-black text-white w-20 sm:w-28 outline-none placeholder-slate-500"
              title="Tocca per modificare il tuo Nickname"
            />
            <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-cyan-300 shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0"
            title="Come si gioca e regolamento"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Regole</span>
          </button>

          <button
            type="button"
            onClick={() => backgroundMusic.toggleMusic()}
            className={`px-2.5 py-1 rounded-full border text-xs font-black flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0 ${
              isMusicOn
                ? 'bg-purple-950/90 border-purple-400/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-400'
            }`}
            title={isMusicOn ? 'Musica: ATTIVA (tocca per silenziare)' : 'Musica: SILENZIATA (tocca per attivare)'}
          >
            {isMusicOn ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span className="hidden sm:inline">Musica</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Muto</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => sfxManager.toggleSfx()}
            className={`px-2.5 py-1 rounded-full border text-xs font-black flex items-center gap-1 cursor-pointer transition active:scale-95 shrink-0 ${
              isSfxOn
                ? 'bg-cyan-950/90 border-cyan-400/80 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-400'
            }`}
            title={isSfxOn ? 'Effetti Sonori: ATTIVI (tocca per silenziare)' : 'Effetti Sonori: SILENZIATI (tocca per attivare)'}
          >
            {isSfxOn ? (
              <>
                <Bell className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">SFX</span>
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">No SFX</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. AREA MODALITÀ DI GIOCO (GRID A 3 SCHEDE BILANCIATE PER IPHONE & GALAXY) */}
      <main className="flex-1 min-h-0 my-1.5 flex items-stretch">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full h-full">
          {/* SCHEDA 1: PARTITA RAPIDA ⚡ (HERO PRINCIPALE) */}
          <div className="h-full rounded-2xl bg-gradient-to-br from-[#2f0e1f] via-[#1a0714] to-[#0c0309] border-2 border-rose-500/70 hover:border-rose-400 shadow-xl shadow-rose-950/40 p-2.5 sm:p-3 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200">
            {/* Ambient Corner Glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-amber-300">
                <Zap className="w-4 h-4 fill-amber-300" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                RAPIDO
              </span>
            </div>

            {/* Content Info */}
            <div className="my-auto py-1">
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-wide text-white uppercase leading-snug">
                Partita Rapida
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-rose-200 leading-tight mt-0.5">
                1 Umano vs 3 Bot PC
              </p>
              <span className="hidden sm:inline-block text-[9px] text-slate-400 mt-1">
                Tavolo al neon immediato
              </span>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => onStartQuickGame(nickname || 'Giocatore 1')}
              className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-black text-xs sm:text-[13px] shadow-lg shadow-rose-950/70 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>GIOCA ORA</span>
            </button>
          </div>

          {/* SCHEDA 2: TAVOLO LOCALE 👥 (PASSA & GIOCA) */}
          <div className="h-full rounded-2xl bg-gradient-to-br from-[#0c2419] via-[#06150f] to-[#020b07] border-2 border-emerald-500/60 hover:border-emerald-400 shadow-xl shadow-emerald-950/40 p-2.5 sm:p-3 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200">
            {/* Ambient Corner Glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                2–4 GIOCATORI
              </span>
            </div>

            {/* Content Info */}
            <div className="my-auto py-1">
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-wide text-white uppercase leading-snug">
                Tavolo Locale
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-200 leading-tight mt-0.5">
                Passa &amp; Gioca sullo Schermo
              </p>
              <span className="hidden sm:inline-block text-[9px] text-slate-400 mt-1">
                Con amici al tavolo e bot
              </span>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setShowLocalModal(true)}
              className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-[13px] shadow-lg shadow-emerald-950/70 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>CONFIGURA</span>
            </button>
          </div>

          {/* SCHEDA 3: GIOCA ONLINE 🌐 (STANZE CON CODICE & QR) */}
          <div className="h-full rounded-2xl bg-gradient-to-br from-[#0c1f2e] via-[#05111b] to-[#02080e] border-2 border-cyan-400/60 hover:border-cyan-300 shadow-xl shadow-cyan-950/40 p-2.5 sm:p-3 flex flex-col justify-between text-left relative overflow-hidden group transition-all duration-200">
            {/* Ambient Corner Glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

            {/* Top Badge & Icon */}
            <div className="flex items-center justify-between w-full">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 flex items-center gap-0.5">
                <QrCode className="w-2.5 h-2.5" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Content Info */}
            <div className="my-auto py-1">
              <h2 className="text-xs sm:text-sm md:text-base font-black tracking-wide text-white uppercase leading-snug">
                Gioca Online
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-cyan-200 leading-tight mt-0.5">
                Stanze con Codice o QR
              </p>
              <span className="hidden sm:inline-block text-[9px] text-slate-400 mt-1">
                Connetti altri smartphone
              </span>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => onOpenOnline(nickname || 'Giocatore 1')}
              className="w-full py-2 px-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-[13px] shadow-lg shadow-cyan-950/70 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>ENTRA / CREA</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. STRISCIA INFERIORE: SHOWCASE CARTE SPECIALI (ALTEZZA CALIBRATA, SWIPE ORIZZONTALE) */}
      <footer className="shrink-0 h-[88px] sm:h-[92px] p-1.5 rounded-2xl bg-[#110924]/90 border border-white/10 flex items-center gap-2 overflow-hidden shadow-inner">
        {/* Etichetta Showcase a Sinistra */}
        <div className="w-[85px] sm:w-[105px] shrink-0 flex flex-col justify-center leading-tight border-r border-white/10 pr-2">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Poteri</span>
          </span>
          <span className="text-[8px] text-slate-400 font-bold mt-0.5">
            Tocca una carta per i dettagli
          </span>
        </div>

        {/* Swipe Orizzontale Carte in Stile UNO */}
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scroll-smooth touch-pan-x py-0.5 select-none">
          {SHOWCASE_CARDS.map((c) => (
            <div
              key={c.id}
              className="shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              onClick={() => setInspectedCard(c)}
              title="Tocca per leggere l'effetto di questa carta"
            >
              <PlayingCard
                card={c}
                size="xs"
                onClick={() => setInspectedCard(c)}
                onInspect={(card) => setInspectedCard(card)}
              />
            </div>
          ))}
        </div>
      </footer>

      {/* MODALE DI CONFIGURAZIONE TAVOLO LOCALE (OTTIMIZZATO IN PROSPETTIVA ORIZZONTALE) */}
      {showLocalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
          <div className="w-full max-w-xl max-h-[92dvh] rounded-3xl bg-[#130b26] border-2 border-emerald-500/50 p-4 text-slate-100 shadow-2xl relative flex flex-col overflow-hidden">
            {/* Header Modale */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white leading-none">
                    Tavolo Locale Passa &amp; Gioca
                  </h3>
                  <span className="text-[9px] text-emerald-300 font-bold">
                    Scegli i giocatori e personalizza i nomi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLocalModal(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo Modale: 2 Colonne su Smartphone Orizzontale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2.5 flex-1 min-h-0 overflow-y-auto pr-1">
              {/* Colonna Sinistra: Modalità Preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  1. Modalità Partecipanti:
                </label>
                <div className="space-y-1.5">
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPreset(opt.id)}
                      className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        selectedPreset === opt.id
                          ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-xs font-black truncate">{opt.title}</div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {opt.subtitle}
                        </div>
                      </div>
                      <span
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                          selectedPreset === opt.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Colonna Destra: Nomi dei 4 Giocatori */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  2. Nomi Fazioni al Tavolo:
                </label>
                <div className="space-y-1.5">
                  {SUITS.map((suit, idx) => {
                    const meta = SUIT_INFO[suit];
                    const isBot = localAiFlags[idx];
                    return (
                      <div
                        key={suit}
                        className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="w-6 h-6 rounded-lg bg-black/50 border border-white/15 flex items-center justify-center font-black text-xs shrink-0">
                          <span className={meta.neonText}>{meta.symbol}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={localNames[idx]}
                            maxLength={14}
                            onChange={(e) => {
                              const newNames = [...localNames];
                              newNames[idx] = e.target.value;
                              setLocalNames(newNames);
                            }}
                            className="w-full bg-transparent text-xs font-bold text-white outline-none"
                            placeholder={`Giocatore ${idx + 1}`}
                          />
                        </div>
                        <span
                          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            isBot
                              ? 'bg-amber-950 text-amber-300 border border-amber-400/40'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-400/40'
                          }`}
                        >
                          {isBot ? 'Bot 🤖' : 'Umano 👤'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Modale: Bottone Avvia Partita */}
            <div className="pt-2 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={handleConfirmLocalStart}
                className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/70 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>AVVIA TAVOLO LOCALE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE REGOLAMENTO COMPLETO */}
      {showRulesModal && (
        <RulesModal onClose={() => setShowRulesModal(false)} />
      )}

      {/* MODALE DETTAGLIO CARTA DALLO SHOWCASE */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          onClose={() => setInspectedCard(null)}
        />
      )}
    </div>
  );
}
