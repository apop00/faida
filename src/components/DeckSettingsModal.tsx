'use client';

import React, { useState } from 'react';
import { Card, CustomDeckConfig, DEFAULT_DECK_CONFIG } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import {
  Beer,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  Info,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Swords,
  X,
  Zap,
} from 'lucide-react';

interface DeckSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CustomDeckConfig;
  onSaveConfig: (newConfig: CustomDeckConfig) => void;
  readOnly?: boolean;
}

interface CardDefinition {
  key: keyof CustomDeckConfig;
  category: 'figure' | 'event';
  title: string;
  count: number;
  countLabel: string;
  badgeLabel: string;
  badgeColor: string;
  sampleCard: Card;
  effect: string;
  counterplay: string;
  icon: string;
}

const CARD_DEFINITIONS: CardDefinition[] = [
  // 1. FIGURE DI POTERE
  {
    key: 'includeAces',
    category: 'figure',
    title: "Asso (A) — Cascata di Semi",
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'CASCATA 🌊',
    badgeColor: 'bg-amber-500/25 border-amber-400 text-amber-200',
    sampleCard: { id: 'hearts-1', suit: 'hearts', value: 1, label: 'A' },
    effect:
      "Lancia la temibile Cascata sul proprio seme! A turno, tutti i giocatori devono rispondere con una carta dello stesso seme. Chi non ce l'ha subisce 1 sorso per ogni carta accumulata nella cascata!",
    counterplay:
      'Rispondere con una carta del seme della cascata, oppure spezzare la cascata con uno Specchio 🪞.',
    icon: '👑',
  },
  {
    key: 'includeJacks',
    category: 'figure',
    title: 'Fante (J) — Spionaggio Tattico',
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'SPIONAGGIO 👁️',
    badgeColor: 'bg-indigo-500/25 border-indigo-400 text-indigo-200',
    sampleCard: { id: 'spades-11', suit: 'spades', value: 11, label: 'J' },
    effect:
      "Permette di sbirciare la mano di un avversario a scelta e lanciare un attacco diretto a sorpresa scegliendo una delle sue carte deboli!",
    counterplay:
      'Il bersaglio può difendersi con un altro Fante (Contro-Spionaggio) o parare con uno Scudo.',
    icon: '🗡️',
  },
  {
    key: 'includeQueens',
    category: 'figure',
    title: 'Regina (Q) — Fardello della Regina',
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'FARDELLO +2 👑',
    badgeColor: 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200',
    sampleCard: { id: 'diamonds-12', suit: 'diamonds', value: 12, label: 'Q' },
    effect:
      "Sferra un attacco pesante da +2 Sorsi cumulabili! Può essere deviata con un'altra Regina su un altro bersaglio o annullata con la beffa del 6.",
    counterplay:
      'Contro-Regina (rimbalzo del fardello), "Beffa del 6" (giocando un 6 neutro) o Specchio 🪞.',
    icon: '💎',
  },
  {
    key: 'includeKings',
    category: 'figure',
    title: 'Re (K) — Brindisi Imperiale & Regicidio',
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'BRINDISI 🍻',
    badgeColor: 'bg-purple-500/25 border-purple-400 text-purple-200',
    sampleCard: { id: 'clubs-13', suit: 'clubs', value: 13, label: 'K' },
    effect:
      'Al grido di "Brindisi del Re!", tutti i 4 giocatori al tavolo devono obbligatoriamente brindare e bere 1 sorso!',
    counterplay:
      '"Regicidio": se un avversario risponde con un altro Re prima di bere, il brindisi viene ribaltato e beve solo chi ha giocato il primo Re!',
    icon: '⚡',
  },

  // 2. CARTE EVENTO
  {
    key: 'includeDirectSips',
    category: 'event',
    title: 'Sorsi Diretti (1🍺, 2🍺, 3🍺, 5🍺)',
    count: 11,
    countLabel: '11 carte (4x 1🍺, 4x 2🍺, 2x 3🍺, 1x 5🍺 di Picche)',
    badgeLabel: 'ATTACCO DIRETTO 🍺',
    badgeColor: 'bg-rose-500/25 border-rose-400 text-rose-200',
    sampleCard: { id: 'event-sip2-1', suit: 'hearts', value: 0, label: '2🍺', eventKind: 'DIRECT_SIPS', sipsAmount: 2 },
    effect:
      "Colpisce direttamente il giocatore della fazione corrispondente al seme della carta, costringendolo a bere immediatamente i sorsi indicati!",
    counterplay:
      'Riflettibile con uno Specchio 🪞: i sorsi tornano raddoppiati a chi ha lanciato la carta!',
    icon: '🍺',
  },
  {
    key: 'includeStop',
    category: 'event',
    title: 'Stop Paracolpi (🚫)',
    count: 8,
    countLabel: '8 carte (4 nelle mani iniziali + 4 nel mazzo)',
    badgeLabel: 'SCUDO TOTALE 🚫',
    badgeColor: 'bg-amber-500/25 border-amber-400 text-amber-200',
    sampleCard: { id: 'event-stop-hearts', suit: 'hearts', value: 0, label: '🚫', eventKind: 'STOP_SUIT' },
    effect:
      "La parata assoluta! Assorbe completamente qualsiasi catena d'attacco in corso, azzera i sorsi accumulati in palio e riporta il tavolo in stato di Tregua.",
    counterplay:
      'Non salta il turno del prossimo: funge da scudo difensivo puro per salvarsi.',
    icon: '🛡️',
  },
  {
    key: 'includeSkip',
    category: 'event',
    title: 'Salta Turno (⏭️)',
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'SALTA TURNO ⏭️',
    badgeColor: 'bg-emerald-500/25 border-emerald-400 text-emerald-200',
    sampleCard: { id: 'event-skip-diamonds', suit: 'diamonds', value: 0, label: '⏭️', eventKind: 'SKIP_TURN' },
    effect:
      'Fa saltare immediatamente il turno al prossimo giocatore in senso di marcia, impedendogli di giocare o pescare carte.',
    counterplay:
      'Contrastabile esclusivamente giocando uno Specchio 🪞 (il salto turno si ritorce contro chi lo ha lanciato).',
    icon: '⏭️',
  },
  {
    key: 'includeReverse',
    category: 'event',
    title: 'Cambio Giro (🔄)',
    count: 4,
    countLabel: '4 carte (1 per seme: ♥, ♦, ♣, ♠)',
    badgeLabel: 'INVERSIONE 🔄',
    badgeColor: 'bg-cyan-500/25 border-cyan-400 text-cyan-200',
    sampleCard: { id: 'event-reverse-clubs', suit: 'clubs', value: 0, label: '🔄', eventKind: 'REVERSE_SUIT' },
    effect:
      'Inverte all\'istante il senso di rotazione del tavolo (da orario ad antiorario e viceversa), salvando chi stava per essere attaccato!',
    counterplay:
      'Un altro Cambio Giro inverte nuovamente la marcia.',
    icon: '🔄',
  },
  {
    key: 'includeMirror',
    category: 'event',
    title: 'Specchio Riflettente (🪞)',
    count: 2,
    countLabel: '2 carte (Quadri ♦ e Fiori ♣)',
    badgeLabel: 'RIFLETTORE 🪞',
    badgeColor: 'bg-purple-500/25 border-purple-400 text-purple-200',
    sampleCard: { id: 'event-mirror-1', suit: 'diamonds', value: 0, label: '🪞', eventKind: 'MIRROR' },
    effect:
      "La carta jolly di contrattacco! Rimanda qualsiasi mossa offensiva, Salta Turno o Sorso Diretto direttamente a chi l'ha scagliata.",
    counterplay:
      'Chi subisce il rimbalzo deve incassare o avere un secondo Specchio per un contro-rimbalzo.',
    icon: '🪞',
  },
  {
    key: 'includeDuel',
    category: 'event',
    title: 'Duello 1v1 Carta Alta/Bassa (⚔️▲ / ⚔️▼)',
    count: 4,
    countLabel: '4 carte (2x Carta Alta ⚔️▲, 2x Carta Bassa ⚔️▼)',
    badgeLabel: 'DUELLO 1V1 ⚔️',
    badgeColor: 'bg-orange-500/25 border-orange-400 text-orange-200',
    sampleCard: { id: 'event-duel-high-1', suit: 'hearts', value: 0, label: '⚔️▲', eventKind: 'DUEL_HIGH' },
    effect:
      'Lancia una sfida testa a testa a un avversario a scelta! Entrambi rivelate una carta numerica (2-10): chi ottiene il punteggio peggiore beve 2 sorsi! In caso di pareggio, bevono entrambi 2 sorsi (+4 totali).',
    counterplay:
      'Giocare la carta numerica più adatta alla condizione (alta o bassa) per far bere l\'avversario.',
    icon: '⚔️',
  },
  {
    key: 'includeSuperDuel',
    category: 'event',
    title: 'Super Duello Tutti (💥▲ / 💥▼)',
    count: 2,
    countLabel: '2 carte (1x Alta 💥▲, 1x Bassa 💥▼)',
    badgeLabel: 'RISSA TOTALE 💥',
    badgeColor: 'bg-rose-600/30 border-rose-500 text-rose-100',
    sampleCard: { id: 'event-super-duel-high', suit: 'hearts', value: 0, label: '💥▲', eventKind: 'SUPER_DUEL_HIGH' },
    effect:
      'Chiama a raccolta tutti i 4 giocatori al tavolo! Tutti calano una carta: il valore peggiore (o tutti i pareggianti sul valore peggiore) beve 2 sorsi!',
    counterplay:
      'Scegliere attentamente la carta numerica per non essere il peggior punteggio del tavolo.',
    icon: '💥',
  },
  {
    key: 'includeTaxRich',
    category: 'event',
    title: 'Tassa sui Ricchi (📉)',
    count: 1,
    countLabel: '1 carta (Quadri ♦)',
    badgeLabel: 'TASSA 📉',
    badgeColor: 'bg-teal-500/25 border-teal-400 text-teal-200',
    sampleCard: { id: 'event-tax-rich', suit: 'diamonds', value: 0, label: '📉', eventKind: 'TAX_RICH' },
    effect:
      'Colpisce chi sta vincendo! Il giocatore con meno carte in mano subisce la tassa: pesca forzatamente +2 carte dal mazzo e beve 1 sorso!',
    counterplay:
      'Avere un numero di carte pari o superiore agli altri giocatori.',
    icon: '📉',
  },
  {
    key: 'includeDrawSwap',
    category: 'event',
    title: 'Scambio a Destra & Pescate di Fazione (🫱, +2, +1)',
    count: 4,
    countLabel: '4 carte (Scambio 🫱, Rossi ♥♦+2, Neri ♣♠+2, Tutti 🃏+1)',
    badgeLabel: 'SCONVOLGI-MANI 🫱',
    badgeColor: 'bg-blue-500/25 border-blue-400 text-blue-200',
    sampleCard: { id: 'event-pass-right', suit: 'hearts', value: 0, label: '🫱', eventKind: 'PASS_RIGHT' },
    effect:
      'Scombussola i piani avversari: costringe tutti a passare 1 carta a destra oppure fa pescare carte extra alle fazioni rivali.',
    counterplay:
      'Sfruttare la carta ricevuta per sferrare un contrattacco al prossimo turno.',
    icon: '🫱',
  },
];

export function DeckSettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  readOnly = false,
}: DeckSettingsModalProps) {
  const [currentConfig, setCurrentConfig] = useState<CustomDeckConfig>({
    ...DEFAULT_DECK_CONFIG,
    ...config,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'figure' | 'event'>('all');

  if (!isOpen) return null;

  // Calculate live deck statistics
  const calculateStats = (cfg: CustomDeckConfig) => {
    let standardCards = 36; // 2..10 (9 * 4)
    if (cfg.includeAces) standardCards += 4;
    if (cfg.includeJacks) standardCards += 4;
    if (cfg.includeQueens) standardCards += 4;
    if (cfg.includeKings) standardCards += 4;

    let eventCards = 0;
    if (cfg.includeDirectSips) eventCards += 11;
    if (cfg.includeReverse) eventCards += 4;
    if (cfg.includeStop) eventCards += 8;
    if (cfg.includeSkip) eventCards += 4;
    if (cfg.includeMirror) eventCards += 2;
    if (cfg.includeDuel) eventCards += 4;
    if (cfg.includeSuperDuel) eventCards += 2;
    if (cfg.includeTaxRich) eventCards += 1;
    if (cfg.includeDrawSwap) eventCards += 4;

    return {
      total: standardCards + eventCards,
      standard: standardCards,
      events: eventCards,
    };
  };

  const stats = calculateStats(currentConfig);

  const handleToggle = (key: keyof CustomDeckConfig) => {
    if (readOnly) return;
    setCurrentConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const applyPreset = (presetName: 'full' | 'combat' | 'classic' | 'drinking') => {
    if (readOnly) return;
    switch (presetName) {
      case 'full':
        setCurrentConfig({ ...DEFAULT_DECK_CONFIG });
        break;
      case 'combat':
        setCurrentConfig({
          includeAces: true,
          includeJacks: true,
          includeQueens: true,
          includeKings: true,
          includeDirectSips: true,
          includeReverse: true,
          includeStop: true,
          includeSkip: true,
          includeMirror: true,
          includeDuel: true,
          includeSuperDuel: true,
          includeTaxRich: false,
          includeDrawSwap: false,
        });
        break;
      case 'classic':
        setCurrentConfig({
          includeAces: true,
          includeJacks: true,
          includeQueens: true,
          includeKings: true,
          includeDirectSips: false,
          includeReverse: false,
          includeStop: false,
          includeSkip: false,
          includeMirror: false,
          includeDuel: false,
          includeSuperDuel: false,
          includeTaxRich: false,
          includeDrawSwap: false,
        });
        break;
      case 'drinking':
        setCurrentConfig({
          includeAces: true,
          includeJacks: false,
          includeQueens: true,
          includeKings: true,
          includeDirectSips: true,
          includeReverse: true,
          includeStop: true,
          includeSkip: true,
          includeMirror: true,
          includeDuel: true,
          includeSuperDuel: true,
          includeTaxRich: true,
          includeDrawSwap: true,
        });
        break;
    }
  };

  const filteredCards = CARD_DEFINITIONS.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const handleSaveAndClose = () => {
    onSaveConfig(currentConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-4xl h-[94dvh] sm:h-[90dvh] max-h-[580px] rounded-3xl bg-gradient-to-b from-[#180a2c] via-[#0d0519] to-[#070211] border-2 border-purple-500/40 shadow-2xl flex flex-col overflow-hidden relative text-slate-100">
        
        {/* HEADER: Titolo, Badge Carte Totali & Presets Rapidi */}
        <div className="shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-white/10 bg-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-950/50">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-tight uppercase flex items-center gap-1.5">
                  <span>Impostazioni Mazzo e Regole Carte</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/25 border border-purple-400 text-purple-200">
                    {stats.total} / 92 Carte
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  Personalizza quali carte speciali ed eventi includere o escludere nella Faida.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title="Chiudi e applica"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets Buttons + Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
            {/* Presets */}
            {!readOnly && (
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 mr-1 hidden sm:inline">
                  Preset:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition border border-white/20 hover:border-purple-400 bg-white/5 hover:bg-purple-900/40 text-slate-200 cursor-pointer"
                >
                  Tutte (92)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('combat')}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition border border-white/20 hover:border-rose-400 bg-white/5 hover:bg-rose-900/40 text-rose-300 cursor-pointer"
                >
                  Rissa & Duelli
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('drinking')}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition border border-white/20 hover:border-amber-400 bg-white/5 hover:bg-amber-900/40 text-amber-300 cursor-pointer"
                >
                  Party Drink
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('classic')}
                  className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition border border-white/20 hover:border-cyan-400 bg-white/5 hover:bg-cyan-900/40 text-cyan-300 cursor-pointer"
                >
                  Classico 52
                </button>
              </div>
            )}

            {/* Filter Tabs (Tutte / Figure / Eventi) */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/10 ml-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase transition ${
                  activeTab === 'all'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tutte ({CARD_DEFINITIONS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('figure')}
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase transition ${
                  activeTab === 'figure'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Figure (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('event')}
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase transition ${
                  activeTab === 'event'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Eventi (9)
              </button>
            </div>
          </div>
        </div>

        {/* LISTA CARTE CON ANTEPRIMA VISIVA, DESCRIZIONE E TOGGLE */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 sm:px-6 sm:py-3 space-y-2.5 divide-y divide-white/5">
          {filteredCards.map((item) => {
            const isEnabled = currentConfig[item.key] ?? true;

            return (
              <div
                key={item.key}
                className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-2xl transition-all ${
                  isEnabled
                    ? 'bg-white/[0.03] border border-white/10 hover:border-purple-500/40'
                    : 'bg-black/40 border border-white/5 opacity-60'
                }`}
              >
                {/* 1. ANTEPRIMA VISIVA REALE DELLA CARTA */}
                <div className="shrink-0 flex flex-col items-center justify-center">
                  <div className={`transition-transform duration-200 ${isEnabled ? 'scale-90 sm:scale-95' : 'scale-85 grayscale opacity-50'}`}>
                    <PlayingCard card={item.sampleCard} size="xs" />
                  </div>
                </div>

                {/* 2. INFORMAZIONI, EFFETTO E CONTROMOSSA */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                      {item.title}
                    </span>
                    <span
                      className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md border ${item.badgeColor}`}
                    >
                      {item.badgeLabel}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                      {item.countLabel}
                    </span>
                  </div>

                  {/* Effetto in gioco */}
                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium leading-relaxed">
                    <strong className="text-amber-300">Effetto:</strong> {item.effect}
                  </p>

                  {/* Come difendersi o contrastare */}
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-normal leading-tight">
                    <strong className="text-cyan-300">Come contrastarla:</strong> {item.counterplay}
                  </p>
                </div>

                {/* 3. SWITCH INTERATTIVO ATTIVA / ESCLUSA */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                        isEnabled
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
                          : 'bg-white/10 hover:bg-white/15 text-slate-400 border border-white/10'
                      }`}
                      title={isEnabled ? 'Tocca per escludere dal mazzo' : 'Tocca per includere nel mazzo'}
                    >
                      {isEnabled ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                          <span>Attiva</span>
                        </>
                      ) : (
                        <span>Esclusa</span>
                      )}
                    </button>
                  ) : (
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {isEnabled ? 'Inclusa' : 'Esclusa'}
                    </span>
                  )}
                  <span className="text-[8px] font-bold text-slate-400">
                    {isEnabled ? `+${item.count} carte` : '0 carte'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER: STATISTICHE E PULSANTE DI CONFERMA */}
        <div className="shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-t border-white/10 bg-[#090314] flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-300">
            <div>
              <span className="text-slate-400">Carte Totali: </span>
              <strong className="text-white font-black">{stats.total}</strong>
            </div>
            <div className="w-[1px] h-3 bg-white/15" />
            <div>
              <span className="text-slate-400">Standard: </span>
              <strong className="text-cyan-300 font-bold">{stats.standard}</strong>
            </div>
            <div className="w-[1px] h-3 bg-white/15" />
            <div>
              <span className="text-slate-400">Eventi: </span>
              <strong className="text-rose-300 font-bold">{stats.events}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => applyPreset('full')}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Ripristina</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-950/60 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conferma ({stats.total} Carte)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
