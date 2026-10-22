'use client';

import React, { useEffect, useState } from 'react';
import { CustomDeckConfig, DEFAULT_DECK_CONFIG, LobbyRoom, MatchPreset } from '@/types/game';
import { SUITS, SUIT_INFO } from '@/lib/gameEngine';
import { QrCodeModal } from './QrCodeModal';
import { QrScannerModal } from './QrScannerModal';
import { DeckSettingsModal } from './DeckSettingsModal';
import {
  Bot,
  ChevronRight,
  Flame,
  Globe,
  KeyRound,
  Lock,
  Play,
  QrCode,
  RefreshCw,
  ScanLine,
  SlidersHorizontal,
  User,
  Users,
  X,
} from 'lucide-react';

interface LobbyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: MatchPreset;
  playerNames: string[];
  aiFlags: boolean[];
  clientPlayerId: string;
  activeLobby: LobbyRoom | null;
  initialTab?: 'quick' | 'create' | 'join';
  onStartLocalPreset: (
    preset: MatchPreset,
    names: string[],
    aiFlags: boolean[],
    deckConfig?: CustomDeckConfig
  ) => void;
  onLobbyJoinedOrUpdated: (room: LobbyRoom) => void;
  onLeaveLobby: () => void;
}

const PRESET_CARDS: {
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
    badge: 'CONSIGLIATO PER PROVARE',
    flags: [false, true, true, true],
  },
  {
    id: '2P_2PC',
    title: '2 Giocatori + 2 PC',
    subtitle: '2 Umani (♥, ♦) e 2 Bot PC (♣, ♠)',
    badge: 'DUO + BOT',
    flags: [false, false, true, true],
  },
  {
    id: '3P_1PC',
    title: '3 Giocatori + 1 PC',
    subtitle: '3 Umani (♥, ♦, ♣) e 1 Bot PC (♠)',
    badge: 'TRIO + BOT',
    flags: [false, false, false, true],
  },
  {
    id: '4P_0PC',
    title: '4 Giocatori Umani',
    subtitle: 'Tutti e 4 i semi guidati da giocatori reali',
    badge: 'PARTY COMPLETO',
    flags: [false, false, false, false],
  },
];

export function LobbyHubModal({
  isOpen,
  onClose,
  currentPreset,
  playerNames,
  aiFlags,
  clientPlayerId,
  activeLobby,
  initialTab,
  onStartLocalPreset,
  onLobbyJoinedOrUpdated,
  onLeaveLobby,
}: LobbyHubModalProps) {
  const [tab, setTab] = useState<'quick' | 'create' | 'join'>(
    initialTab || (activeLobby ? 'create' : 'quick')
  );
  const [selectedPreset, setSelectedPreset] = useState<MatchPreset>(currentPreset);
  const [localNames, setLocalNames] = useState<string[]>(playerNames);
  const [localAiFlags, setLocalAiFlags] = useState<boolean[]>(aiFlags);

  // Lobby creation / join states
  const [nickname, setNickname] = useState<string>(playerNames[0] || 'Giocatore 1');
  const [roomName, setRoomName] = useState<string>('Tavolo Faida di Semi');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [publicRooms, setPublicRooms] = useState<LobbyRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [deckConfig, setDeckConfig] = useState<CustomDeckConfig>(
    activeLobby?.deckConfig || DEFAULT_DECK_CONFIG
  );
  const [showDeckSettingsModal, setShowDeckSettingsModal] = useState(false);

  useEffect(() => {
    if (activeLobby?.deckConfig) {
      setDeckConfig(activeLobby.deckConfig);
    }
  }, [activeLobby]);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    } else if (activeLobby) {
      setTab('create');
    }
  }, [activeLobby, initialTab, isOpen]);

  const fetchPublicRooms = async () => {
    try {
      const res = await fetch('/api/lobbies');
      const data = await res.json();
      if (data.rooms) {
        setPublicRooms(data.rooms);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (tab === 'join') {
      fetchPublicRooms();
      const interval = setInterval(fetchPublicRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const applyPresetSelection = (presetId: MatchPreset) => {
    setSelectedPreset(presetId);
    const found = PRESET_CARDS.find((p) => p.id === presetId);
    if (found) {
      setLocalAiFlags([...found.flags]);
      setLocalNames(
        SUITS.map((s, idx) =>
          found.flags[idx]
            ? `Bot ${SUIT_INFO[s].name} 🤖`
            : idx === 0
            ? nickname || 'Tu (Cuori)'
            : `Giocatore ${idx + 1}`
        )
      );
    }
  };

  const handleCreateLobby = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          roomName,
          hostName: nickname || 'Host',
          hostClientId: clientPlayerId,
          isPublic,
          preset: selectedPreset,
          deckConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore creazione lobby');
      onLobbyJoinedOrUpdated(data.room);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore creazione lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLobbyDeckConfig = async (newConfig: CustomDeckConfig) => {
    setDeckConfig(newConfig);
    if (!activeLobby) return;
    try {
      const res = await fetch(`/api/lobbies/${activeLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'configure',
          deckConfig: newConfig,
        }),
      });
      const data = await res.json();
      if (data.room) onLobbyJoinedOrUpdated(data.room);
    } catch {
      // Ignore
    }
  };

  const handleJoinByCode = async (codeToJoin: string, preferredSlot?: number) => {
    const cleanCode = codeToJoin.trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          code: cleanCode,
          playerName: nickname || 'Ospite',
          clientPlayerId,
          preferredSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lobby non trovata');
      onLobbyJoinedOrUpdated(data.room);
      if (data.room.status === 'playing') {
        onClose();
      } else {
        setTab('create');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Impossibile unirsi alla lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLobbySlotAI = async (slotIndex: number, makeAI: boolean) => {
    if (!activeLobby) return;
    try {
      const res = await fetch(`/api/lobbies/${activeLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'configure',
          slotIndex,
          isAI: makeAI,
        }),
      });
      const data = await res.json();
      if (data.room) onLobbyJoinedOrUpdated(data.room);
    } catch {
      // Ignore
    }
  };

  const handleChangeLobbyPreset = async (preset: MatchPreset) => {
    if (!activeLobby) return;
    try {
      const res = await fetch(`/api/lobbies/${activeLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'configure',
          preset,
        }),
      });
      const data = await res.json();
      if (data.room) onLobbyJoinedOrUpdated(data.room);
    } catch {
      // Ignore
    }
  };

  const handleStartLobbyMatch = async () => {
    if (!activeLobby) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lobbies/${activeLobby.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'start' }),
      });
      const data = await res.json();
      if (data.room) {
        onLobbyJoinedOrUpdated(data.room);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-3.5 overflow-y-auto select-none">
      <div className="w-full max-w-xl max-h-[94vh] sm:max-h-[340px] overflow-y-auto no-scrollbar rounded-3xl bg-gradient-to-b from-[#170e2e] to-[#080411] border-2 border-white/15 p-3.5 sm:p-4 text-slate-100 shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase tracking-widest mb-1">
          <Users className="w-3.5 h-3.5" />
          <span>Modalità Giocatori, Bot PC & Lobby</span>
        </div>
        <h2 className="text-xl font-black text-white mb-3">
          Configura Partita o Lobby
        </h2>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-4 text-xs font-black">
          <button
            type="button"
            onClick={() => setTab('quick')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              tab === 'quick'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gioca vs PC
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              tab === 'create'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeLobby ? `Lobby (${activeLobby.code})` : 'Crea Lobby'}
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              tab === 'join'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unisciti / QR
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 font-bold">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: AVVIO RAPIDO VS PC (1P+3PC, 2P+2PC, 3P+1PC, 4P) */}
        {tab === 'quick' && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              {PRESET_CARDS.map((preset) => {
                const active = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPresetSelection(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'bg-rose-600/20 border-rose-400 ring-2 ring-rose-500/40'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className="inline-block w-fit px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[8px] font-black uppercase tracking-wider mb-1">
                      {preset.badge}
                    </span>
                    <div className="text-xs font-black text-white">
                      {preset.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                      {preset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Individual 4 Faction Slots (Name + Human/Bot PC Toggle) */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Fazioni al Tavolo (Tocca Umano / PC per personalizzare):
              </div>
              {SUITS.map((suit, idx) => {
                const sMeta = SUIT_INFO[suit];
                const isBot = localAiFlags[idx];
                return (
                  <div
                    key={suit}
                    className="flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base font-black border ${sMeta.badgeBg} shrink-0`}
                    >
                      {sMeta.symbol}
                    </span>
                    <input
                      type="text"
                      value={localNames[idx] || ''}
                      onChange={(e) => {
                        const copy = [...localNames];
                        copy[idx] = e.target.value;
                        setLocalNames(copy);
                      }}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextFlags = [...localAiFlags];
                        nextFlags[idx] = !nextFlags[idx];
                        setLocalAiFlags(nextFlags);
                        const nextNames = [...localNames];
                        nextNames[idx] = nextFlags[idx]
                          ? `Bot ${sMeta.name} 🤖`
                          : `Giocatore ${idx + 1}`;
                        setLocalNames(nextNames);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 border transition cursor-pointer shrink-0 ${
                        isBot
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      }`}
                    >
                      {isBot ? (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>PC Bot</span>
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          <span>Umano</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pulsante Impostazioni Mazzo e Regole Carte */}
            <button
              type="button"
              onClick={() => setShowDeckSettingsModal(true)}
              className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-400/40 hover:border-purple-300 text-left flex items-center justify-between cursor-pointer transition shadow"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Regole e Carte nel Mazzo</span>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50 uppercase">
                      Personalizza
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Scegli quali carte speciali ed eventi attivare o escludere
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                onStartLocalPreset(selectedPreset, localNames, localAiFlags, deckConfig);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-fuchsia-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Avvia Subito ({PRESET_CARDS.find((p) => p.id === selectedPreset)?.title})</span>
            </button>
          </div>
        )}

        {/* TAB 2: CREA O GESTISCI LOBBY (Pubblica o Privata con Codice / QR) */}
        {tab === 'create' && (
          <div className="space-y-3.5">
            {!activeLobby ? (
              <>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Il tuo Nome Giocatore
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Es. Marco"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Nome della Lobby
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Es. Tavolo del Venerdì"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white"
                    />
                  </div>

                  {/* Public vs Private Toggle */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Visibilità Stanza
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 cursor-pointer ${
                          isPublic
                            ? 'bg-emerald-500/20 border-emerald-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black">Pubblica</div>
                          <div className="text-[9px] opacity-80">
                            Visibile nella lista stanze
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 cursor-pointer ${
                          !isPublic
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black">Privata</div>
                          <div className="text-[9px] opacity-80">
                            Solo con Codice o QR
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Preset selector for Lobby */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Configurazione Giocatori / Bot PC
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_CARDS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPreset(p.id)}
                          className={`p-2 rounded-xl border text-xs font-black cursor-pointer ${
                            selectedPreset === p.id
                              ? 'bg-rose-600/25 border-rose-400 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Impostazioni Mazzo e Regole Carte */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Regole Mazzo e Carte della Partita
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDeckSettingsModal(true)}
                      className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-400/40 hover:border-purple-300 text-left flex items-center justify-between cursor-pointer transition shadow"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-300" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>Personalizza Carte & Effetti</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50 uppercase">
                              Mazzo Personalizzabile
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Carte speciali, Duelli e Regole Sorsi / Vendetta dell&apos;Assetato
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateLobby}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {loading ? 'Creazione in corso...' : 'Crea Lobby & Genera Codice / QR'}
                  </span>
                </button>
              </>
            ) : (
              /* ACTIVE LOBBY WAITING ROOM */
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/20 to-purple-600/20 border border-rose-400/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                        {activeLobby.isPublic ? '🌐 Lobby Pubblica' : '🔒 Lobby Privata'}
                      </span>
                    </div>
                    <div className="text-2xl font-black tracking-widest text-amber-400">
                      {activeLobby.code}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {activeLobby.roomName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mostra QR</span>
                  </button>
                </div>

                {/* Quick Preset Switcher inside Lobby */}
                <div className="grid grid-cols-4 gap-1">
                  {PRESET_CARDS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleChangeLobbyPreset(p.id)}
                      className={`py-1.5 px-1 rounded-xl text-[9px] font-black border cursor-pointer ${
                        activeLobby.preset === p.id
                          ? 'bg-rose-600 text-white border-rose-300'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      {p.id.replace('_', ' + ')}
                    </button>
                  ))}
                </div>

                {/* 4 Slots in Lobby */}
                <div className="space-y-2">
                  {activeLobby.slots.map((slot) => {
                    const sMeta = SUIT_INFO[slot.suit];
                    const isMe = slot.clientPlayerId === clientPlayerId;
                    return (
                      <div
                        key={slot.slotIndex}
                        className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                          isMe
                            ? 'bg-rose-950/50 border-rose-400/60'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-base font-black border ${sMeta.badgeBg}`}
                          >
                            {sMeta.symbol}
                          </span>
                          <div>
                            <div className="text-xs font-black text-white flex items-center gap-1.5">
                              <span>{slot.name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[8px] uppercase">
                                  Tu
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {slot.isAI
                                ? 'Controllato dal PC (Bot IA)'
                                : slot.clientPlayerId
                                ? 'Giocatore Connesso ✓'
                                : 'In attesa di un giocatore (Codice/QR)...'}
                            </div>
                          </div>
                        </div>

                        {!isMe && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleLobbySlotAI(slot.slotIndex, !slot.isAI)
                            }
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border cursor-pointer ${
                              slot.isAI
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            }`}
                          >
                            {slot.isAI ? '🤖 Bot PC' : '👤 Umano'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Deck settings row */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-black text-white">Regole Mazzo & Carte</div>
                      <div className="text-[10px] text-slate-400">
                        {activeLobby.hostClientId === clientPlayerId
                          ? 'Personalizza carte ed eventi attivi'
                          : "Configurazione mazzo impostata dall'Host"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeckSettingsModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase hover:bg-amber-500/30 transition-colors cursor-pointer"
                  >
                    {activeLobby.hostClientId === clientPlayerId ? '⚙️ Modifica' : '👁️ Visualizza'}
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onLeaveLobby}
                    className="px-3 py-3 rounded-2xl bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    Esci Lobby
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleStartLobbyMatch}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Avvia Tavolo Lobby</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UNISCITI A LOBBY (Pubbliche, Codice o QR Scanner) */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Il tuo Nome Giocatore
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Il tuo nome..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white"
              />
            </div>

            {/* Join via Code or QR Camera */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Entra in Lobby Privata o Pubblica (Codice / QR)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="CODICE (es. AB12CD)"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-black/50 border border-white/20 text-sm font-black tracking-widest uppercase text-amber-300 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  disabled={!joinCodeInput.trim() || loading}
                  onClick={() => handleJoinByCode(joinCodeInput)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase cursor-pointer disabled:opacity-40"
                >
                  Entra
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Inquadra QR Code Stanza</span>
              </button>
            </div>

            {/* Public Lobbies List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Lobby Pubbliche Aperte ({publicRooms.length})</span>
                </span>
                <button
                  type="button"
                  onClick={fetchPublicRooms}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Aggiorna
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 text-center text-xs text-slate-400">
                  Nessuna lobby pubblica attiva in questo momento. Creane una nel tab &ldquo;Crea Lobby&rdquo;!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {publicRooms.map((r) => {
                    const humanCount = r.slots.filter((s) => !s.isAI && s.clientPlayerId).length;
                    const botCount = r.slots.filter((s) => s.isAI).length;
                    return (
                      <div
                        key={r.code}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>{r.roomName}</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono">
                              {r.code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            👤 {humanCount} Umani • 🤖 {botCount} Bot PC •{' '}
                            {r.status === 'playing' ? 'In Partita' : 'In Attesa'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleJoinByCode(r.code)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase cursor-pointer"
                        >
                          Unisciti
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals for QR display & QR scanning */}
      {activeLobby && (
        <QrCodeModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          roomCode={activeLobby.code}
          roomName={activeLobby.roomName}
        />
      )}

      <QrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onCodeScanned={(scannedCode) => {
          setJoinCodeInput(scannedCode);
          handleJoinByCode(scannedCode);
        }}
      />

      <DeckSettingsModal
        isOpen={showDeckSettingsModal}
        onClose={() => setShowDeckSettingsModal(false)}
        config={deckConfig}
        onSaveConfig={(newConfig) => {
          setDeckConfig(newConfig);
          if (activeLobby && activeLobby.hostClientId === clientPlayerId) {
            handleUpdateLobbyDeckConfig(newConfig);
          }
        }}
        readOnly={Boolean(activeLobby && activeLobby.hostClientId !== clientPlayerId)}
      />
    </div>
  );
}
