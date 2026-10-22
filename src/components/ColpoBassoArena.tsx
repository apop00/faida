'use client';

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  computeAIMove,
  createInitialGameState,
  calculateBaseAttackSips,
  gameReducer,
  getCardPlayability,
  getControllingPlayerIndex,
  getTargetBonusCards,
  SUIT_INFO,
  validateCardSelection,
} from '@/lib/gameEngine';
import { Card, GameAction, LobbyRoom, MatchPreset, Player } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { TargetBonusModal } from './TargetBonusModal';
import { VictoryModal } from './VictoryModal';
import { RulesModal } from './RulesModal';
import { LobbyHubModal } from './LobbyHubModal';
import { QrCodeModal } from './QrCodeModal';
import { DuelModal } from './DuelModal';
import { DrinkAlertModal, DrinkAlertData } from './DrinkAlertModal';
import { TurnAlertModal, TurnAlertData } from './TurnAlertModal';
import { CardDetailModal } from './CardDetailModal';
import { AttackTrajectoryOverlay } from './AttackTrajectoryOverlay';
import { PlayerAvatar } from './PlayerAvatar';
import { playCardDrawSound, playCardPlaySound, playTurnSound } from '@/lib/audioEffects';
import {
  ArrowLeftRight,
  Beer,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  Crosshair,
  Eye,
  EyeOff,
  History,
  Home,
  Layers,
  Menu,
  QrCode,
  RotateCcw,
  RotateCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';

const DEFAULT_NAMES_1P_3PC = [
  'Tu (Cuori)',
  'Bot Quadri 🤖',
  'Bot Fiori 🤖',
  'Bot Picche 🤖',
];
const DEFAULT_FLAGS_1P_3PC = [false, true, true, true];

export interface ColpoBassoArenaProps {
  initialPreset?: MatchPreset;
  initialPlayerNames?: string[];
  initialAiFlags?: boolean[];
  initialLobbyRoom?: LobbyRoom | null;
  initialOpenLobbyTab?: 'quick' | 'create' | 'join' | null;
  onBackToHome?: () => void;
}

export function ColpoBassoArena({
  initialPreset = '1P_3PC',
  initialPlayerNames = DEFAULT_NAMES_1P_3PC,
  initialAiFlags = DEFAULT_FLAGS_1P_3PC,
  initialLobbyRoom = null,
  initialOpenLobbyTab = null,
  onBackToHome,
}: ColpoBassoArenaProps = {}) {
  const [currentPreset, setCurrentPreset] = useState<MatchPreset>(initialPreset);
  const [playerNames, setPlayerNames] = useState<string[]>(initialPlayerNames);
  const [aiFlags, setAiFlags] = useState<boolean[]>(initialAiFlags);
  const [clientPlayerId, setClientPlayerId] = useState<string>('local_player');
  const [activeLobby, setActiveLobby] = useState<LobbyRoom | null>(initialLobbyRoom);

  const [state, dispatchLocal] = useReducer(gameReducer, undefined, () =>
    createInitialGameState(initialPlayerNames, initialAiFlags)
  );

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedTargetOpponent, setSelectedTargetOpponent] = useState<number | null>(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [showQuickQrModal, setShowQuickQrModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [idleTurnReminder, setIdleTurnReminder] = useState(false);
  const [hideHandPrivacy, setHideHandPrivacy] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [playerDeltas, setPlayerDeltas] = useState<
    Record<number, { sips: number; cards: number }>
  >({});
  const [drinkAlert, setDrinkAlert] = useState<DrinkAlertData | null>(null);
  const [turnAlert, setTurnAlert] = useState<TurnAlertData | null>(null);
  const [inspectedCard, setInspectedCard] = useState<{
    card: Card;
    isTopCard?: boolean;
  } | null>(null);
  const [cardAnimation, setCardAnimation] = useState<{
    id: string;
    type: 'PLAY' | 'DRAW';
    playerIndex: number;
    card?: Card;
  } | null>(null);
  const prevCanActRef = useRef<boolean>(false);
  const prevControllingRef = useRef<number | null>(null);
  const prevPlayerStatsRef = useRef<{ sips: number; cards: number }[] | null>(null);
  const prevTopCardIdRef = useRef<string>(state.topCard.id);
  const handScrollRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track changes in sipsDrunk and hand.length to trigger floating +X🍺 / +X🃏 badges and DrinkAlertModal
  useEffect(() => {
    const currentStats = state.players.map((p) => ({
      sips: p.sipsDrunk,
      cards: p.hand.length,
    }));

    if (prevPlayerStatsRef.current) {
      const newDeltas: Record<number, { sips: number; cards: number }> = {};
      let hasAnyDelta = false;

      // Trigger card flight animations when a card is played or drawn
      const isTopCardChanged = state.topCard.id !== prevTopCardIdRef.current;
      if (isTopCardChanged) {
        // Someone played a card down to the table!
        const playerWhoPlayed = currentStats.findIndex((curr, idx) => {
          const prev = prevPlayerStatsRef.current?.[idx];
          return prev && curr.cards < prev.cards;
        });
        const playerIdx = playerWhoPlayed >= 0 ? playerWhoPlayed : (prevControllingRef.current ?? 0);
        setCardAnimation({
          id: 'play_' + Date.now(),
          type: 'PLAY',
          playerIndex: playerIdx,
          card: state.topCard,
        });
        playCardPlaySound();
        prevTopCardIdRef.current = state.topCard.id;
        setTimeout(() => {
          setCardAnimation((prev) => (prev?.type === 'PLAY' ? null : prev));
        }, 420);
      } else {
        // Check if someone drew cards
        const playerWhoDrew = currentStats.findIndex((curr, idx) => {
          const prev = prevPlayerStatsRef.current?.[idx];
          return prev && curr.cards > prev.cards;
        });
        if (playerWhoDrew >= 0) {
          setCardAnimation({
            id: 'draw_' + Date.now(),
            type: 'DRAW',
            playerIndex: playerWhoDrew,
          });
          playCardDrawSound();
          setTimeout(() => {
            setCardAnimation((prev) => (prev?.type === 'DRAW' ? null : prev));
          }, 420);
        }
      }

      currentStats.forEach((curr, idx) => {
        const prev = prevPlayerStatsRef.current?.[idx];
        if (!prev) return;
        // Ignore full game reset where sips drop back to 0
        if (curr.sips === 0 && prev.sips > 0) return;

        const dSips = curr.sips - prev.sips;
        const dCards = curr.cards - prev.cards;
        if (dSips > 0 || dCards > 0) {
          newDeltas[idx] = {
            sips: dSips > 0 ? dSips : 0,
            cards: dCards > 0 ? dCards : 0,
          };
          hasAnyDelta = true;
        }

        // Trigger DrinkAlertModal if a human player has to drink!
        const p = state.players[idx];
        const isHuman = !p.isAI;
        const mySlot = activeLobby
          ? activeLobby.slots.findIndex((s) => s.clientPlayerId === clientPlayerId)
          : -1;
        const isMySlot = mySlot === -1 ? isHuman : mySlot === idx;

        if (dSips > 0 && isMySlot && state.mode !== 'GAME_OVER' && !state.activeDuel) {
          const drinkEv = state.lastDrinkEvent;
          const isMatchingEvent =
            drinkEv &&
            (drinkEv.drinkerIndex === idx ||
              drinkEv.drinkerIndex === -1 ||
              drinkEv.drinkerName.includes(p.name));

          const fromPlayerName = isMatchingEvent ? drinkEv?.senderName : undefined;
          const fromPlayerSuit = isMatchingEvent ? drinkEv?.senderSuit : undefined;
          const cardLabel = isMatchingEvent ? drinkEv?.cardLabel : undefined;
          const cardSuit = isMatchingEvent ? drinkEv?.cardSuit : undefined;
          const reasonTitle =
            (isMatchingEvent ? drinkEv?.reason : null) ||
            state.lastActionBanner?.subtitle ||
            state.lastActionBanner?.title ||
            'Penalità Sorsi!';

          setDrinkAlert({
            playerName: p.name,
            suit: p.suit,
            sips: dSips,
            reason: reasonTitle,
            fromPlayerName,
            fromPlayerSuit,
            cardLabel,
            cardSuit,
          });
        }
      });

      if (hasAnyDelta) {
        setPlayerDeltas((prev) => ({ ...prev, ...newDeltas }));
        const timer = setTimeout(() => {
          setPlayerDeltas({});
        }, 2300);
        prevPlayerStatsRef.current = currentStats;
        return () => clearTimeout(timer);
      }
    }

    prevPlayerStatsRef.current = currentStats;
  }, [state.players, activeLobby, clientPlayerId, state.mode, state.activeDuel, state.lastActionBanner, state.lastDrinkEvent]);

  // Initialize persistent clientPlayerId and check URL for ?lobby=CODE
  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    let savedId = window.localStorage.getItem('cb_client_id');
    if (!savedId) {
      savedId = 'cb_' + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem('cb_client_id', savedId);
    }
    setClientPlayerId(savedId);

    const params = new URLSearchParams(window.location.search);
    const lobbyCode = params.get('lobby') || params.get('code');
    if (lobbyCode) {
      fetch('/api/lobbies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          code: lobbyCode.toUpperCase(),
          playerName: 'Giocatore',
          clientPlayerId: savedId,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.room) {
            setActiveLobby(data.room);
            if (data.room.gameState) {
              dispatchLocal({ type: 'SYNC_STATE', nextState: data.room.gameState });
            } else {
              setShowLobbyModal(true);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Unified dispatcher: dispatches locally AND syncs to lobby server if in a room
  const dispatchAction = useCallback(
    async (action: GameAction) => {
      dispatchLocal(action);
      if (activeLobby && activeLobby.status === 'playing') {
        try {
          const res = await fetch(`/api/lobbies/${activeLobby.code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: 'dispatch',
              gameAction: action,
            }),
          });
          const data = await res.json();
          if (data.room?.gameState) {
            setActiveLobby(data.room);
            dispatchLocal({ type: 'SYNC_STATE', nextState: data.room.gameState });
          }
        } catch {
          // Fallback to local state
        }
      }
    },
    [activeLobby]
  );

  // Poll lobby state when connected to a multiplayer room
  useEffect(() => {
    if (!activeLobby) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lobbies/${activeLobby.code}`);
        const data = await res.json();
        if (data.room) {
          setActiveLobby(data.room);
          if (data.room.gameState) {
            dispatchLocal({ type: 'SYNC_STATE', nextState: data.room.gameState });
          }
        }
      } catch {
        // Ignore network hiccup
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [activeLobby]);

  const controllingPlayerIndex = getControllingPlayerIndex(state);
  const controllingPlayer = state.players[controllingPlayerIndex];
  const isControllingPlayerAI = Boolean(controllingPlayer?.isAI);

  const myLobbySlotIndex = activeLobby
    ? activeLobby.slots.findIndex((s) => s.clientPlayerId === clientPlayerId)
    : -1;

  const firstHumanIndex = state.players.findIndex((p) => !p.isAI);
  const displayedHandIndex =
    myLobbySlotIndex >= 0
      ? myLobbySlotIndex
      : !isControllingPlayerAI
      ? controllingPlayerIndex
      : firstHumanIndex >= 0
      ? firstHumanIndex
      : 0;

  const displayedHandPlayer = state.players[displayedHandIndex] || controllingPlayer;
  const canLocalUserAct =
    !isControllingPlayerAI &&
    (myLobbySlotIndex === -1 || myLobbySlotIndex === controllingPlayerIndex);

  // Clear card selection when turn or mode changes
  useEffect(() => {
    setSelectedCardIds([]);
    setSelectedTargetOpponent((controllingPlayerIndex + 1) % 4);
  }, [
    controllingPlayerIndex,
    state.mode,
    state.topCard.id,
    state.specialEvent?.type,
  ]);

  // 10-second idle reminder: avviso "TOCCA A TE" se il giocatore resta inattivo per 10 secondi
  useEffect(() => {
    if (!canLocalUserAct || state.mode === 'GAME_OVER') {
      setIdleTurnReminder(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    setIdleTurnReminder(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setIdleTurnReminder(true);
      playTurnSound();
    }, 10000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [
    canLocalUserAct,
    controllingPlayerIndex,
    state.activePlayerIndex,
    state.defenderIndex,
    state.mode,
    state.topCard.id,
    selectedCardIds.length,
  ]);

  // Monitor turn changes for human player to trigger unmissable "TOCCA A TE!" popup
  useEffect(() => {
    if (state.mode === 'GAME_OVER') {
      setTurnAlert(null);
      return;
    }

    const prevCanAct = prevCanActRef.current;
    const prevControlling = prevControllingRef.current;
    prevCanActRef.current = canLocalUserAct;
    prevControllingRef.current = controllingPlayerIndex;

    const becameActive = canLocalUserAct && (!prevCanAct || prevControlling !== controllingPlayerIndex);
    if (becameActive && !state.activeDuel) {
      const p = state.players[controllingPlayerIndex];
      if (p) {
        setTurnAlert({
          playerName: p.name,
          suit: p.suit,
          mode: state.mode,
          currentSips: state.currentSips,
        });
      }
    } else if (!canLocalUserAct) {
      setTurnAlert(null);
    }
  }, [canLocalUserAct, controllingPlayerIndex, state.mode, state.currentSips, state.activeDuel]);

  // Automatic AI / Bot PC Turn Execution
  useEffect(() => {
    if (state.mode === 'GAME_OVER' || !isControllingPlayerAI) {
      return;
    }
    if (activeLobby && activeLobby.hostClientId !== clientPlayerId) {
      return;
    }

    const timeout = setTimeout(() => {
      const aiMove = computeAIMove(state);
      if (aiMove) {
        dispatchAction(aiMove);
      }
    }, 1150);

    return () => clearTimeout(timeout);
  }, [state, isControllingPlayerAI, activeLobby, clientPlayerId, dispatchAction]);

  const bonusCards = canLocalUserAct
    ? getTargetBonusCards(state, controllingPlayerIndex)
    : [];

  const selectedCards = selectedCardIds
    .map((id) => displayedHandPlayer.hand.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const selectionValidation = canLocalUserAct
    ? validateCardSelection(state, controllingPlayerIndex, selectedCards)
    : { valid: false };

  const needsOpponentPicker =
    canLocalUserAct &&
    state.mode === 'NEUTRAL_FLOW' &&
    selectedCards.length === 1 &&
    (selectedCards[0].value === 11 ||
      selectedCards[0].value === 12 ||
      selectedCards[0].eventKind === 'DUEL_HIGH' ||
      selectedCards[0].eventKind === 'DUEL_LOW');

  const handleCardTap = (cardId: string) => {
    if (turnAlert) setTurnAlert(null);
    if (!canLocalUserAct) return;
    const tappedCard = displayedHandPlayer.hand.find((c) => c.id === cardId);
    if (!tappedCard) return;

    const playability = getCardPlayability(state, controllingPlayerIndex, tappedCard);

    setSelectedCardIds((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }

      if (prev.length > 0 && state.mode === 'NEUTRAL_FLOW') {
        const selectedObjs = prev
          .map((id) => displayedHandPlayer.hand.find((c) => c.id === id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));

        // Modifica 4: If PASS_RIGHT (Scambia a Destra 🫱) is selected, tapping ANY other card in hand selects it as the card to pass!
        const existingPassRight = selectedObjs.find((c) => c.eventKind === 'PASS_RIGHT');
        if (existingPassRight && tappedCard.id !== existingPassRight.id) {
          return [existingPassRight.id, tappedCard.id];
        }
      }

      if (!playability.playable) return prev;

      if (
        prev.length > 0 &&
        (state.mode === 'NEUTRAL_FLOW' ||
          (state.mode === 'SPECIAL_EVENT' &&
            state.specialEvent?.type === 'JACK_SPY' &&
            state.specialEvent.phase === 'SPYING_ATTACK'))
      ) {
        const firstSelected = displayedHandPlayer.hand.find((c) => c.id === prev[0]);
        if (
          firstSelected &&
          !firstSelected.eventKind &&
          !tappedCard.eventKind &&
          firstSelected.value === tappedCard.value &&
          tappedCard.value >= 2 &&
          tappedCard.value <= 10 &&
          prev.length < 4
        ) {
          return [...prev, cardId];
        }
      }

      return [cardId];
    });
  };

  const handlePlaySelected = () => {
    if (!canLocalUserAct || !selectionValidation.valid || selectedCardIds.length === 0) {
      return;
    }
    dispatchAction({
      type: 'PLAY_CARDS',
      cardIds: selectedCardIds,
      targetPlayerIndex: selectedTargetOpponent ?? (controllingPlayerIndex + 1) % 4,
    });
    setSelectedCardIds([]);
    setSelectedTargetOpponent(null);
  };

  const handleStartLocalPreset = (
    preset: MatchPreset,
    names: string[],
    flags: boolean[]
  ) => {
    setActiveLobby(null);
    setCurrentPreset(preset);
    setPlayerNames(names);
    setAiFlags(flags);
    dispatchLocal({
      type: 'INIT_GAME',
      playerNames: names,
      aiFlags: flags,
    });
    setSelectedCardIds([]);
  };

  // Helper to render an Opponent Seat with Pod + Visible 3D Cards on Table (UNO Mobile Style)
  // Helper to render an Opponent Seat:
  // - North: Ultra-clean horizontal capsule + horizontal cards in top bar (never cut off at the top!)
  // - West & East: Avatar Pod on top + Cards fanned in an Arc underneath (UNO Mobile Vez/Angel style)
  const renderOpponentSeat = (player: Player, orientation: 'west' | 'north' | 'east' = 'north') => {
    const idx = player.id;
    const suitMeta = SUIT_INFO[player.suit];
    const isControlling = idx === controllingPlayerIndex;
    const isAttacker = state.mode === 'ATTACK_CHAIN' && idx === state.activePlayerIndex;
    const isDefender = state.mode === 'ATTACK_CHAIN' && idx === state.defenderIndex;
    const delta = playerDeltas[idx];
    const cleanName = player.name.replace('Bot ', '').replace(' 🤖', '');
    const actualCardCount = player.hand.length;
    const isNorth = orientation === 'north';
    const isSingle = actualCardCount === 1;

    const isTargetCandidate = needsOpponentPicker;
    const effectiveTargetId = selectedTargetOpponent ?? (controllingPlayerIndex + 1) % 4;
    const isSelectedTarget = isTargetCandidate && effectiveTargetId === player.id;

    // A) NORTH SEAT: SLEEK HORIZONTAL CAPSULE (PERFECT FOR TOP BAR)
    if (isNorth) {
      const visibleNorthCards = actualCardCount === 0 ? 0 : Math.min(actualCardCount, 5);

      return (
        <div
          key={player.id}
          className="flex items-center gap-1.5 sm:gap-2 select-none"
        >
          {/* Horizontal Pod */}
          <div
            onClick={() => {
              if (isTargetCandidate) setSelectedTargetOpponent(player.id);
            }}
            className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all select-none backdrop-blur-md shadow-md ${
              isSelectedTarget
                ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.7)] scale-105 cursor-pointer z-30'
                : isTargetCandidate
                ? 'bg-[#180f2c]/90 border-purple-400/50 hover:border-purple-300 cursor-pointer'
                : isDefender
                ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)] animate-pulse'
                : isAttacker
                ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.5)]'
                : isControlling
                ? 'bg-emerald-950/90 border-emerald-400 ring-1 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                : 'bg-[#120a22]/85 border-white/15'
            }`}
            title={isTargetCandidate ? `Tocca per bersagliare ${cleanName}` : player.name}
          >
            {/* Delta Floating Badges */}
            {delta && (delta.sips > 0 || delta.cards > 0) && (
              <div className="absolute -bottom-3 right-2 z-30 flex items-center gap-0.5 pointer-events-none animate-bounce">
                {delta.sips > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 border border-amber-300 text-white text-[8px] font-black">
                    +{delta.sips}🍺
                  </span>
                )}
                {delta.cards > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 border border-white text-slate-950 text-[8px] font-black">
                    +{delta.cards}🃏
                  </span>
                )}
              </div>
            )}

            {/* Sorsi a Sinistra 🍺 */}
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400/80 text-amber-300 shadow-sm"
              title={`${player.sipsDrunk} sorsi bevuti`}
            >
              <span className="text-[8px] leading-none">🍺</span>
              <span className="text-[10px] font-black leading-none">{player.sipsDrunk}</span>
            </div>

            {/* Avatar */}
            <PlayerAvatar
              suit={player.suit}
              name={player.name}
              isAI={player.isAI}
              isAttacker={isAttacker}
              isDefender={isDefender}
              isControlling={isControlling}
              sipsDelta={delta?.sips || 0}
              size="sm"
            />

            {/* Nome + Status */}
            <div className="flex items-center gap-1 leading-none px-0.5">
              <span className={`text-[10px] ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
              <span className="text-[10px] font-black text-white truncate max-w-[55px]">{cleanName}</span>
              {isControlling && <span className="text-[7px] text-emerald-400 font-extrabold uppercase">TURNO</span>}
              {isDefender && <span className="text-[7px] text-rose-400 font-extrabold uppercase animate-pulse">DIFESA</span>}
              {isAttacker && <span className="text-[7px] text-amber-400 font-extrabold uppercase">ATTACCO</span>}
              {isTargetCandidate && (
                <span className="text-[7px] text-purple-300 font-extrabold uppercase">
                  {isSelectedTarget ? '🎯' : 'Tocca'}
                </span>
              )}
            </div>

            {/* Conteggio Carte 🃏 */}
            <div
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border shadow-sm ${
                isSingle
                  ? 'bg-rose-600/40 border-rose-400 text-white ring-1 ring-rose-400 animate-pulse'
                  : 'bg-cyan-950/90 border-cyan-400/80 text-cyan-200'
              }`}
              title={`${actualCardCount} carte in mano`}
            >
              <span className="text-[8px] leading-none">🃏</span>
              <span className="text-[10px] font-black leading-none">{actualCardCount}</span>
            </div>
          </div>

          {/* North Cards fanned horizontally */}
          {visibleNorthCards > 0 && (
            <div className="flex items-center -space-x-2.5 select-none filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              {Array.from({ length: visibleNorthCards }).map((_, cIdx, arr) => {
                const mid = (arr.length - 1) / 2;
                const rot = (cIdx - mid) * 5;
                const offsetY = Math.abs(cIdx - mid) * 1;

                return (
                  <div
                    key={cIdx}
                    style={{
                      transform: `rotate(${rot}deg) translateY(${offsetY}px)`,
                      zIndex: cIdx + 1,
                    }}
                    className={`relative w-[22px] h-[32px] rounded-md shrink-0 select-none transition-all duration-300 ${
                      isSingle
                        ? 'bg-gradient-to-br from-rose-700 via-rose-950 to-black border-2 border-amber-300 ring-2 ring-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse'
                        : 'bg-gradient-to-br from-[#2a1354] via-[#160a2d] to-[#090216] border border-cyan-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
                    }`}
                  >
                    <div className="absolute inset-0.5 rounded border border-white/20 flex flex-col items-center justify-center bg-white/5 overflow-hidden">
                      <span className={`text-[8px] font-black ${isSingle ? 'text-amber-300' : suitMeta.neonText}`}>
                        {isSingle ? '⚡' : suitMeta.symbol}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // B) WEST & EAST SEATS: AVATAR POD ON TOP + CARDS IN AN ARC UNDERNEATH (UNO Mobile Vez/Angel style)
    const visibleCardsCount = actualCardCount === 0 ? 0 : Math.min(actualCardCount, 6);

    const podElement = (
      <div
        key={`pod-${player.id}`}
        onClick={() => {
          if (isTargetCandidate) setSelectedTargetOpponent(player.id);
        }}
        className={`relative flex flex-col items-center justify-between p-1 rounded-2xl border transition-all select-none backdrop-blur-md shadow-lg w-[82px] sm:w-[88px] ${
          isSelectedTarget
            ? 'bg-purple-950/90 border-purple-400 ring-2 ring-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.7)] scale-105 cursor-pointer z-30'
            : isTargetCandidate
            ? 'bg-[#180f2c]/90 border-purple-400/50 hover:border-purple-300 cursor-pointer'
            : isDefender
            ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.6)] animate-pulse'
            : isAttacker
            ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.5)]'
            : isControlling
            ? 'bg-emerald-950/90 border-emerald-400 ring-1 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
            : 'bg-[#120a22]/85 border-white/15'
        }`}
        title={isTargetCandidate ? `Tocca per bersagliare ${cleanName}` : player.name}
      >
        {/* Floating Animated Delta Badges */}
        {delta && (delta.sips > 0 || delta.cards > 0) && (
          <div className="absolute -top-3 right-0 z-30 flex items-center gap-0.5 pointer-events-none animate-bounce">
            {delta.sips > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 border border-amber-300 text-white text-[9px] font-black">
                +{delta.sips}🍺
              </span>
            )}
            {delta.cards > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 border border-white text-slate-950 text-[9px] font-black">
                +{delta.cards}🃏
              </span>
            )}
          </div>
        )}

        {/* Nome del giocatore in alto con simbolo seme */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/50 border border-white/15 text-[9px] font-black text-white w-full justify-center leading-none mb-1">
          <span className={`text-[10px] ${suitMeta.neonText}`}>{suitMeta.symbol}</span>
          <span className="truncate max-w-[48px]">{cleanName}</span>
          {isControlling && <span className="text-[7px] text-emerald-400 font-extrabold uppercase">TURNO</span>}
          {isDefender && <span className="text-[7px] text-rose-400 font-extrabold uppercase animate-pulse">DIFESA</span>}
          {isAttacker && <span className="text-[7px] text-amber-400 font-extrabold uppercase">ATTACCO</span>}
          {isTargetCandidate && (
            <span className="text-[7px] text-purple-300 font-extrabold uppercase">
              {isSelectedTarget ? '🎯' : 'Tocca'}
            </span>
          )}
        </div>

        {/* Trio: Sorsi a SINISTRA | Avatar al CENTRO | Carte a DESTRA */}
        <div className="flex items-center justify-between gap-1 w-full px-0.5">
          {/* Numero a SINISTRA per i sorsi bevuti 🍺 */}
          <div
            className="flex flex-col items-center justify-center px-1 py-0.5 rounded-lg bg-amber-950/90 border border-amber-400/80 text-amber-300 shadow-sm min-w-[22px]"
            title={`${player.sipsDrunk} sorsi bevuti`}
          >
            <span className="text-[8px] leading-none">🍺</span>
            <span className="text-[10px] sm:text-[11px] font-black text-amber-300 leading-tight mt-0.5">
              {player.sipsDrunk}
            </span>
          </div>

          {/* Avatar al CENTRO */}
          <PlayerAvatar
            suit={player.suit}
            name={player.name}
            isAI={player.isAI}
            isAttacker={isAttacker}
            isDefender={isDefender}
            isControlling={isControlling}
            sipsDelta={delta?.sips || 0}
            size="sm"
          />

          {/* Numero a DESTRA per le carte in mano 🃏 */}
          <div
            className={`flex flex-col items-center justify-center px-1 py-0.5 rounded-lg border shadow-sm min-w-[22px] ${
              isSingle
                ? 'bg-rose-600/40 border-rose-400 text-white ring-1 ring-rose-400 animate-pulse'
                : 'bg-cyan-950/90 border-cyan-400/80 text-cyan-200'
            }`}
            title={`${actualCardCount} carte in mano`}
          >
            <span className="text-[8px] leading-none">🃏</span>
            <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 leading-tight mt-0.5">
              {actualCardCount}
            </span>
          </div>
        </div>
      </div>
    );

    // Cards fanned in an Arc (Ventaglio ad Arco)
    const cardsArcElement = actualCardCount > 0 ? (
      <div
        key={`cards-${player.id}`}
        className="flex items-center -space-x-3.5 select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] mt-0.5"
        title={`${player.name}: ${actualCardCount} carte sul tavolo`}
      >
        {Array.from({ length: visibleCardsCount }).map((_, cIdx, arr) => {
          const mid = (arr.length - 1) / 2;
          
          // Smooth arc calculation:
          // West curves towards center-right; East curves towards center-left
          let rot = 0;
          let offsetY = 0;

          if (orientation === 'west') {
            rot = -10 + (cIdx * 6.5);
            offsetY = Math.pow(cIdx - mid, 2) * 1.5;
          } else {
            rot = 10 - (cIdx * 6.5);
            offsetY = Math.pow(cIdx - mid, 2) * 1.5;
          }

          return (
            <div
              key={cIdx}
              style={{
                transform: `rotate(${rot}deg) translateY(${offsetY}px)`,
                zIndex: orientation === 'east' ? arr.length - cIdx : cIdx + 1,
              }}
              className={`relative w-[26px] h-[38px] sm:w-[28px] sm:h-[42px] rounded-lg shrink-0 select-none transition-all duration-300 ${
                isSingle
                  ? 'bg-gradient-to-br from-rose-700 via-rose-950 to-black border-2 border-amber-300 ring-2 ring-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.9)] animate-pulse'
                  : 'bg-gradient-to-br from-[#2a1354] via-[#160a2d] to-[#090216] border-2 border-cyan-400/80 shadow-[0_4px_12px_rgba(0,0,0,0.7)]'
              }`}
            >
              <div className="absolute inset-0.5 rounded border border-white/20 flex flex-col items-center justify-center bg-white/5 overflow-hidden">
                <span
                  className={`text-[9px] font-black ${
                    isSingle ? 'text-amber-300' : suitMeta.neonText
                  }`}
                >
                  {isSingle ? '⚡' : suitMeta.symbol}
                </span>
                {isSingle && (
                  <span className="text-[6px] font-black text-rose-300 uppercase tracking-tighter leading-none mt-0.5 animate-bounce">
                    1!
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-lg" />
            </div>
          );
        })}
      </div>
    ) : null;

    // Return vertical stack with pod on top and cards arc underneath
    return (
      <div
        key={player.id}
        className="flex flex-col items-center gap-1 select-none"
      >
        {podElement}
        {cardsArcElement}
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#090414] text-slate-300 text-xs font-black uppercase tracking-widest">
        Caricamento Tavolo...
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-between bg-[#090514] text-slate-100 select-none relative overflow-hidden">
      {/* 1. TOP BAR UNIFICATA (Menu + Avversario Nord + Seme Attivo) */}
      <header className="h-[38px] sm:h-[42px] shrink-0 w-full flex items-center justify-between px-2 py-1 z-30 select-none bg-[#090514]/90 backdrop-blur-sm">
        {/* Bottone Menu a Tendina (In alto a sinistra) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenuDropdown((v) => !v)}
            className="px-2 py-1 rounded-xl bg-[#140b2a]/90 hover:bg-[#201340] border border-white/20 text-slate-200 shadow flex items-center gap-1 cursor-pointer backdrop-blur-md active:scale-95 transition"
            title="Menu Opzioni"
          >
            <Menu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Menu</span>
          </button>

          {/* Menu a Tendina a comparsa */}
          {showMenuDropdown && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setShowMenuDropdown(false)}
              />
              <div className="absolute top-9 left-0 z-50 w-52 rounded-2xl bg-[#140b2a] border-2 border-white/20 shadow-2xl p-2 flex flex-col gap-1.5 animate-speech-pop">
                {onBackToHome && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuDropdown(false);
                      if (
                        state.mode === 'GAME_OVER' ||
                        window.confirm('Vuoi tornare alla Home? La partita in corso andrà persa.')
                      ) {
                        onBackToHome();
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-left text-xs font-bold text-amber-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-amber-400" />
                    <span>Torna alla Home</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setShowLobbyModal(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-left text-xs font-bold text-white flex items-center gap-2 transition cursor-pointer"
                >
                  <Users className="w-4 h-4 text-rose-400" />
                  <span>{activeLobby ? `Lobby: ${activeLobby.code}` : currentPreset.replace('_', ' vs ')}</span>
                </button>

                {activeLobby && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuDropdown(false);
                      setShowQuickQrModal(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-left text-xs font-bold text-cyan-300 flex items-center gap-2 transition cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Condividi QR Code</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setShowRulesModal(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-left text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Regole del Gioco</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setShowLogs(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-left text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
                >
                  <History className="w-4 h-4 text-purple-400" />
                  <span>Storico Mosse</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* AVVERSARIO 2 (Nord ♣ - In alto al centro) */}
        <div className="flex items-center justify-center">
          {state.players[2] && renderOpponentSeat(state.players[2], 'north')}
        </div>

        {/* Seme Attivo a Terra (In alto a destra, compatto e discreto) */}
        <div
          className={`px-2 py-0.5 rounded-full bg-[#140b2a]/90 border border-white/20 text-[10px] font-black flex items-center gap-1 shadow backdrop-blur-md ${
            SUIT_INFO[state.topCard.suit].neonText
          }`}
          title={`Seme attivo a terra: ${SUIT_INFO[state.topCard.suit].name}`}
        >
          <span className="text-xs leading-none">{SUIT_INFO[state.topCard.suit].symbol}</span>
          <span className="text-[10px] font-black">{SUIT_INFO[state.topCard.suit].name}</span>
        </div>
      </header>

      {/* Avviso Inattività 10 Secondi "TOCCA A TE!" Compatto e Discreto */}
      {idleTurnReminder && canLocalUserAct && (
        <div
          onClick={() => setIdleTurnReminder(false)}
          className="absolute top-9 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-slate-950 font-black shadow-lg border border-white flex items-center gap-2 cursor-pointer select-none animate-bounce"
          title="Tocca per chiudere"
        >
          <span className="text-xs">⏰</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
            TOCCA A TE!
          </span>
          <span className="text-[9px] font-bold text-slate-900 truncate max-w-[150px]">
            {state.mode === 'ATTACK_CHAIN' ? `Difenditi (${state.currentSips}🍺)` : 'Gioca o pesca'}
          </span>
          <span className="text-[10px] font-black ml-1">✕</span>
        </div>
      )}

      {/* 2. TAVOLO CENTRALE IN PROSPETTIVA 2.5D (4 LATI, FELTRO INCLINATO) */}
      <section className="relative px-1.5 py-0.5 flex-1 min-h-0 flex items-center justify-between gap-1 sm:gap-2 z-10 overflow-hidden perspective-arena">
        {/* Traiettoria d'Attacco Laser al Neon animata */}
        <AttackTrajectoryOverlay
          state={state}
          controllingPlayerIndex={controllingPlayerIndex}
        />

        {/* LATO SINISTRO: AVVERSARIO 1 (Ovest ♦) */}
        <div className="shrink-0 self-center z-20 flex justify-center">
          {state.players[1] && renderOpponentSeat(state.players[1], 'west')}
        </div>

        {/* ZONA CENTRALE: TAVOLO APERTO SENZA IL PESANTE QUADRATO RIGIDO */}
        <div className="flex-1 min-h-0 h-full flex flex-col items-center justify-between z-10 px-1 py-0.5 relative">
          {/* Pill Minimale di Stato + Ultima Mossa (Discreta e Fluttuante) */}
          <div className="w-full max-w-[360px] flex items-center justify-between gap-1.5 px-2.5 py-0.5 rounded-full bg-[#140b2a]/70 border border-white/10 backdrop-blur-sm z-10 shadow-sm mt-0.5">
            <span
              className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider text-[8px] sm:text-[9px] shrink-0 border ${
                state.mode === 'ATTACK_CHAIN'
                  ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                  : state.mode === 'SPECIAL_EVENT'
                  ? 'bg-purple-500/25 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
              }`}
            >
              {state.mode === 'ATTACK_CHAIN'
                ? '🔥 Attacco'
                : state.mode === 'SPECIAL_EVENT'
                ? '⚡ Evento'
                : '🟢 Tregua'}
            </span>

            <span className="text-slate-300 font-medium truncate text-right text-[10px]">
              {state.lastActionBanner
                ? state.lastActionBanner.subtitle
                : 'Inizia la mano'}
            </span>
          </div>

          {/* Centro Tavolo Libero e Spazioso: Mazzo Pesca | Pila Scarto (Carta a terra) | Sorsi in Palio */}
          <div className="w-full max-w-[420px] flex items-center justify-around my-auto py-0.5 z-10 relative">
            {/* Animazione di Volo Carta (Lancio a terra o Pescata) */}
            {cardAnimation && (
              <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                {cardAnimation.type === 'PLAY' && (
                  <div
                    key={cardAnimation.id}
                    className={`shrink-0 shadow-2xl ${
                      cardAnimation.playerIndex === 1
                        ? 'animate-fly-from-west'
                        : cardAnimation.playerIndex === 2
                        ? 'animate-fly-from-north'
                        : cardAnimation.playerIndex === 3
                        ? 'animate-fly-from-east'
                        : 'animate-fly-from-south'
                    }`}
                  >
                    <PlayingCard card={cardAnimation.card || state.topCard} size="sm" />
                  </div>
                )}

                {cardAnimation.type === 'DRAW' && (
                  <div
                    key={cardAnimation.id}
                    className={`w-[48px] h-[68px] sm:w-[54px] sm:h-[76px] rounded-xl bg-gradient-to-br from-[#27154d] via-[#14082c] to-[#090216] border-2 border-cyan-400 shadow-2xl flex items-center justify-center shrink-0 ${
                      cardAnimation.playerIndex === 1
                        ? 'animate-fly-to-west'
                        : cardAnimation.playerIndex === 2
                        ? 'animate-fly-to-north'
                        : cardAnimation.playerIndex === 3
                        ? 'animate-fly-to-east'
                        : 'animate-fly-to-south'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                      <span className="text-xs">🍺</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Animazione Giro del Tavolo (In trasparenza discreta sul feltro) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div
                className={`w-[190px] h-[190px] sm:w-[220px] sm:h-[220px] rounded-full border-2 border-dashed ${
                  state.lastDirection === 'forward'
                    ? 'border-cyan-400/40 text-cyan-300 animate-rotate-clockwise'
                    : 'border-amber-400/40 text-amber-300 animate-rotate-counter-clockwise'
                } opacity-25 flex items-center justify-center relative`}
              >
                {/* Frecce direzionali orbitanti lungo la circonferenza */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest">
                  {state.lastDirection === 'forward' ? '▶▶▶' : '◀◀◀'}
                </span>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest">
                  {state.lastDirection === 'forward' ? '◀◀◀' : '▶▶▶'}
                </span>
                <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[10px] font-black tracking-widest rotate-90">
                  {state.lastDirection === 'forward' ? '◀◀◀' : '▶▶▶'}
                </span>
                <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[10px] font-black tracking-widest rotate-90">
                  {state.lastDirection === 'forward' ? '▶▶▶' : '◀◀◀'}
                </span>
              </div>
            </div>

            {/* Mazzo di Pesca 3D (Pila fisica di carte a faccia in giù con dorso Faida) */}
            <div
              role="button"
              tabIndex={canLocalUserAct ? 0 : -1}
              onClick={() => canLocalUserAct && dispatchAction({ type: 'DRAW_AND_PASS' })}
              className={`relative flex flex-col items-center group transition select-none z-10 ${
                canLocalUserAct ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-85'
              }`}
              title={canLocalUserAct ? `Mazzo (${state.deck.length} carte) - Tocca per pescare` : `Mazzo (${state.deck.length} carte)`}
            >
              {/* Spessore 3D a strati (fogli di cartoncino sfalsati per effetto mazzo reale) */}
              <div className="absolute -bottom-1.5 -right-1.5 w-[50px] h-[72px] sm:w-[56px] sm:h-[80px] rounded-xl bg-slate-300/40 border border-slate-400/30 -rotate-3" />
              <div className="absolute -bottom-0.5 -right-0.5 w-[50px] h-[72px] sm:w-[56px] sm:h-[80px] rounded-xl bg-slate-200 border border-slate-400/50 shadow-md rotate-1" />

              {/* Carta in Cima al Mazzo (Dorso carta Faida con cornice bianca e finitura scura) */}
              <div className="relative w-[50px] h-[72px] sm:w-[56px] sm:h-[80px] rounded-xl bg-white p-[2px] shadow-[0_6px_16px_rgba(0,0,0,0.6)] group-hover:-translate-y-1 transition-transform duration-200">
                <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-[#1c1038] via-[#100724] to-[#080214] border border-cyan-400/40 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Pattern geometrico a rombi sottile sul dorso */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:6px_6px]" />

                  {/* Emblema centrale Faida */}
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-300/50 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                    <span className="text-[10px] sm:text-xs">⚔️</span>
                  </div>

                  <span className="text-[6px] font-black uppercase tracking-widest text-cyan-200/70 mt-1">
                    FAIDA
                  </span>

                  {/* Luce sweep diagonale */}
                  <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 pointer-events-none group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </div>

              {/* Conteggio carte nel mazzo */}
              <div className="mt-1 px-1.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-[8px] font-bold text-slate-300 flex items-center gap-1 shadow-sm">
                <Layers className="w-2.5 h-2.5 text-cyan-400" />
                <span>{state.deck.length}</span>
              </div>
            </div>

            {/* Pila di Scarto con carte impilate a rotazione sottostante per effetto fisico */}
            <div
              className="relative flex flex-col items-center cursor-pointer group shrink-0"
              onClick={() => setInspectedCard({ card: state.topCard, isTopCard: true })}
              title="Tocca per ingrandire la carta a terra"
            >
              {/* Carte fantasma sottostanti per profondità 3D del mazzo di scarto */}
              <div className="absolute inset-0 w-full h-full rounded-xl bg-[#1b1035] border border-white/10 rotate-[-5deg] scale-[0.97] opacity-60 pointer-events-none shadow-md" />
              <div className="absolute inset-0 w-full h-full rounded-xl bg-[#231545] border border-white/15 rotate-[4deg] scale-[0.98] opacity-80 pointer-events-none shadow-md" />

              {/* Carta in cima con animazione Slam */}
              <div key={state.topCard.id} className="relative z-10 animate-card-slam">
                <PlayingCard
                  card={state.topCard}
                  size="sm"
                  onInspect={(c) => setInspectedCard({ card: c, isTopCard: true })}
                />
              </div>
            </div>

            {/* Sorsi in Palio + Indicatore Direzione */}
            <div className="flex flex-col items-center min-w-[65px] gap-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                In Palio
              </span>
              <div
                className={`px-2.5 py-1 rounded-full border font-black text-xs sm:text-sm flex items-center gap-1 shadow-sm ${
                  state.currentSips > 0
                    ? 'bg-rose-600/30 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>🍺</span>
                <span>{state.currentSips}</span>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1 text-[8px] font-black text-slate-300">
                {state.lastDirection === 'forward' ? (
                  <>
                    <RotateCw className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Orario</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-2.5 h-2.5 text-amber-400" />
                    <span>Inverso</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LATO DESTRO: AVVERSARIO 3 (Est ♠) */}
        <div className="shrink-0 self-center z-20 flex justify-center">
          {state.players[3] && renderOpponentSeat(state.players[3], 'east')}
        </div>

        {/* Special Overlays: Spionaggio (Jack Hand Reveal) or Beffa del 6 Redirect Picker */}
        {state.mode === 'SPECIAL_EVENT' &&
          state.specialEvent?.type === 'JACK_SPY' &&
          state.specialEvent.phase === 'SPYING_ATTACK' &&
          !isControllingPlayerAI && (
            <div className="p-2 rounded-2xl bg-purple-950/90 border border-purple-400/60 shrink-0 z-20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-purple-200">
                  👁️ Carte di {state.players[state.specialEvent.targetIndex].name}:
                </span>
                <button
                  type="button"
                  onClick={() => dispatchAction({ type: 'RESOLVE_SPECIAL_PASS' })}
                  className="px-2 py-0.5 rounded-md bg-white/15 text-[9px] font-bold text-white cursor-pointer"
                >
                  Passa
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {state.players[state.specialEvent.targetIndex].hand.map((c) => (
                  <div key={c.id} className="shrink-0">
                    <PlayingCard
                      card={c}
                      size="xs"
                      onInspect={(card) => setInspectedCard({ card, isTopCard: false })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        {state.mode === 'SPECIAL_EVENT' &&
          state.specialEvent?.type === 'QUEEN_BURDEN' &&
          state.specialEvent.phase === 'SELECTING_REDIRECT_TARGET' &&
          !isControllingPlayerAI && (
            <div className="p-2 rounded-2xl bg-amber-950/90 border border-amber-400/60 shrink-0 z-20">
              <div className="text-[10px] font-black text-amber-300 uppercase mb-1">
                🃏 Scegli chi pesca +2 carte:
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {state.players
                  .filter((p) => p.id !== controllingPlayerIndex)
                  .map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() =>
                        dispatchAction({
                          type: 'SELECT_QUEEN_REDIRECT',
                          targetPlayerIndex: opp.id,
                        })
                      }
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-slate-950 border border-white/20 text-[10px] font-black transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span className={SUIT_INFO[opp.suit].neonText}>
                        {SUIT_INFO[opp.suit].symbol}
                      </span>
                      <span className="truncate">{opp.name.replace(' 🤖', '')}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
      </section>

      {/* 3. LA TUA MANO + PULSANTI AZIONE (INTEGRATA SUL TAVOLO, ELEVATA IN PRIMO PIANO) */}
      <footer
        className={`relative px-2 sm:px-3 pb-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-transparent shrink-0 select-none transition-all duration-300 overflow-visible ${
          canLocalUserAct ? 'z-50' : 'z-40'
        }`}
      >
        {/* Floating Animated Delta Badges on Local Player */}
        {playerDeltas[displayedHandPlayer.id] &&
          (playerDeltas[displayedHandPlayer.id].sips > 0 ||
            playerDeltas[displayedHandPlayer.id].cards > 0) && (
            <div className="absolute -top-3 left-4 z-40 flex items-center gap-1.5 pointer-events-none animate-bounce">
              {playerDeltas[displayedHandPlayer.id].sips > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 border border-amber-300 text-white text-xs font-black shadow-lg">
                  +{playerDeltas[displayedHandPlayer.id].sips}🍺
                </span>
              )}
              {playerDeltas[displayedHandPlayer.id].cards > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500 border border-white text-slate-950 text-xs font-black shadow-lg">
                  +{playerDeltas[displayedHandPlayer.id].cards}🃏
                </span>
              )}
            </div>
          )}

        {/* CONTENITORE 3 COLONNE (PROFILO SX | MANO CENTRO | AZIONI DX) */}
        <div className="flex items-end justify-between gap-1 sm:gap-2 w-full overflow-visible">
          {/* COLONNA 1 (SX): PROFILO GIOCATORE LOCALE PULITO E CHIARO */}
          <div className="flex flex-col items-center justify-between p-1.5 rounded-2xl bg-[#140a26]/90 border border-white/20 w-[96px] sm:w-[104px] h-[108px] sm:h-[114px] shrink-0 shadow-xl select-none mb-0.5">
            {/* Nome del giocatore in alto */}
            <div className="px-2 py-0.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-black text-white flex items-center gap-1 w-full justify-center shadow-sm">
              <span className={SUIT_INFO[displayedHandPlayer.suit].neonText}>
                {SUIT_INFO[displayedHandPlayer.suit].symbol}
              </span>
              <span className="truncate max-w-[65px]">TU ({displayedHandPlayer.name.replace(' 🤖', '')})</span>
            </div>

            {/* Trio: Sorsi a SINISTRA | Avatar al CENTRO | Carte a DESTRA */}
            <div className="flex items-center justify-between gap-1 w-full my-auto px-0.5">
              {/* Sorsi a SINISTRA 🍺 */}
              <div
                className="flex flex-col items-center justify-center px-1.5 py-0.5 rounded-xl bg-amber-950/90 border border-amber-400/80 text-amber-300 shadow-sm min-w-[26px]"
                title={`${displayedHandPlayer.sipsDrunk} sorsi bevuti`}
              >
                <span className="text-[9px] leading-none">🍺</span>
                <span className="text-xs font-black text-amber-300 leading-tight mt-0.5">
                  {displayedHandPlayer.sipsDrunk}
                </span>
              </div>

              {/* Avatar al CENTRO */}
              <PlayerAvatar
                suit={displayedHandPlayer.suit}
                name={displayedHandPlayer.name}
                isAI={displayedHandPlayer.isAI}
                isAttacker={state.mode === 'ATTACK_CHAIN' && displayedHandPlayer.id === state.activePlayerIndex}
                isDefender={state.mode === 'ATTACK_CHAIN' && displayedHandPlayer.id === state.defenderIndex}
                isControlling={displayedHandPlayer.id === controllingPlayerIndex}
                sipsDelta={playerDeltas[displayedHandPlayer.id]?.sips || 0}
                size="sm"
              />

              {/* Carte a DESTRA 🃏 */}
              <div
                className="flex flex-col items-center justify-center px-1.5 py-0.5 rounded-xl bg-cyan-950/90 border border-cyan-400/80 text-cyan-200 shadow-sm min-w-[26px]"
                title={`${displayedHandPlayer.hand.length} carte in mano`}
              >
                <span className="text-[9px] leading-none">🃏</span>
                <span className="text-xs font-black text-cyan-300 leading-tight mt-0.5">
                  {displayedHandPlayer.hand.length}
                </span>
              </div>
            </div>

            {/* Target Bonus CTA if candidate cards exist */}
            {bonusCards.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBonusModal(true)}
                className="w-full py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] uppercase tracking-wider cursor-pointer shadow active:scale-95 transition text-center"
              >
                🎯 3🍺 BONUS
              </button>
            )}
          </div>

          {/* COLONNA 2 (CENTRO): MANO DI CARTE PULITA E IN PRIMO PIANO */}
          <div
            className={`flex-1 min-w-0 h-[112px] sm:h-[118px] relative flex items-end justify-center overflow-visible ${
              canLocalUserAct ? 'z-50 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]' : 'z-40'
            }`}
          >
            {hideHandPrivacy ? (
              <div className="h-[130px] w-full rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center p-2 text-center self-end mb-1">
                <p className="text-[11px] font-bold text-slate-300 mb-1">
                  Passa a <strong className="text-white">{displayedHandPlayer.name}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setHideHandPrivacy(false)}
                  className="px-3 py-1 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Rivela Carte
                </button>
              </div>
            ) : (
              (() => {
                const evaluated = displayedHandPlayer.hand.map((card) => {
                  const playability = canLocalUserAct
                    ? getCardPlayability(state, controllingPlayerIndex, card)
                    : { playable: true };
                  return { card, playability };
                });

                const getPriority = (actionType?: string) => {
                  switch (actionType) {
                    case 'DEFENSE_MIRROR':
                    case 'SPECIAL_COUNTER_MIRROR':
                    case 'DEFENSE_COUNTER':
                    case 'DEFENSE_DEVIATE':
                      return 1;
                    case 'DEFENSE_SHIELD':
                    case 'DEFENSE_STOP':
                    case 'DEFENSE_SHOCK':
                      return 2;
                    case 'EVENT_DIRECT_SIPS':
                    case 'FACTION_ATTACK':
                    case 'COMBO_COMPANION':
                    case 'EVENT_DUEL_HIGH':
                    case 'EVENT_DUEL_LOW':
                    case 'EVENT_SUPER_DUEL_HIGH':
                    case 'EVENT_SUPER_DUEL_LOW':
                      return 3;
                    case 'EVENT_TAX_RICH':
                    case 'EVENT_REVERSE':
                    case 'EVENT_STOP':
                    case 'EVENT_PASS_RIGHT':
                    case 'EVENT_RED_DRAW_2':
                    case 'EVENT_BLACK_DRAW_2':
                    case 'EVENT_ALL_DRAW_1':
                      return 4;
                    case 'LINK_DISCARD':
                    case 'EVENT_SIPS_SUIT_COMPANION':
                      return 5;
                    default:
                      return 6;
                  }
                };

                const playableList = canLocalUserAct
                  ? evaluated
                      .filter((item) => item.playability.playable)
                      .sort((a, b) => {
                        const pDiff =
                          getPriority(a.playability.actionType) -
                          getPriority(b.playability.actionType);
                        if (pDiff !== 0) return pDiff;
                        return b.card.value - a.card.value;
                      })
                  : evaluated;

                const unplayableList = canLocalUserAct
                  ? evaluated.filter((item) => !item.playability.playable)
                  : [];

                // Combine into a single unified hand list without dividing line
                const handCards = [...playableList, ...unplayableList];
                const totalCards = handCards.length;

                // Calibrazione overlap: garantisce che le carte stiano nel centro senza generare barre di scorrimento verticali
                const overlapClass =
                  totalCards > 12
                    ? '-mr-7 sm:-mr-8'
                    : totalCards > 9
                    ? '-mr-5 sm:-mr-6'
                    : totalCards > 6
                    ? '-mr-3 sm:-mr-4'
                    : totalCards > 4
                    ? '-mr-1.5'
                    : 'mr-1 sm:mr-1.5';

                const scrollContainerClass =
                  totalCards > 16
                    ? 'overflow-x-auto overflow-y-visible scroll-smooth touch-pan-x no-scrollbar'
                    : 'overflow-visible';

                return (
                  <div className="relative w-full h-full flex items-end justify-center overflow-visible">
                    <div
                      ref={handScrollRef}
                      onWheel={(e) => {
                        if (handScrollRef.current && Math.abs(e.deltaY) > 0) {
                          handScrollRef.current.scrollLeft += e.deltaY;
                        }
                      }}
                      className={`${scrollContainerClass} pt-6 pb-0.5 px-2 h-full w-full select-none flex items-end justify-center`}
                    >
                      <div className="flex items-end justify-center min-w-full w-max h-full overflow-visible">
                        {handCards.map(({ card, playability }, cIdx) => {
                          const isSelected = selectedCardIds.includes(card.id);
                          const mid = (totalCards - 1) / 2;
                          const baseAngle = totalCards > 1 ? Math.max(-6, Math.min(6, (cIdx - mid) * 1.5)) : 0;
                          const baseOffsetY = totalCards > 1 ? Math.abs(cIdx - mid) * 0.8 : 0;

                          return (
                            <div
                              key={card.id}
                              style={{
                                transform: isSelected
                                  ? 'translateY(-14px) scale(1.08) rotate(0deg)'
                                  : `rotate(${baseAngle}deg) translateY(${baseOffsetY}px)`,
                                transformOrigin: 'bottom center',
                                zIndex: isSelected ? 80 : canLocalUserAct ? cIdx + 30 : cIdx + 10,
                                animationDelay: `${cIdx * 35}ms`,
                              }}
                              className={`shrink-0 transition-transform duration-200 ease-out cursor-pointer animate-hand-fan ${overlapClass} last:mr-0 hover:-translate-y-3 hover:scale-105 hover:rotate-0 hover:z-70`}
                            >
                              <PlayingCard
                                card={card}
                                playability={playability}
                                selected={isSelected}
                                size="xs"
                                interactive={canLocalUserAct}
                                onClick={() => handleCardTap(card.id)}
                                onInspect={(c) => setInspectedCard({ card: c, isTopCard: false })}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* COLONNA 3 (DX): PULSANTI D'AZIONE ERGONOMICI SOTTO IL POLLICE DESTRO */}
          <div className="w-[110px] sm:w-[125px] shrink-0 h-[108px] sm:h-[114px] flex flex-col justify-end gap-1 select-none self-end mb-0.5 relative">
            {/* Sleek Compact Target Selector Pill Anchored Above Action Column */}
            {needsOpponentPicker && (
              <div className="absolute -top-10 right-0 z-40 flex items-center gap-1 py-1 px-1.5 rounded-xl bg-[#140b2a]/95 border border-purple-400/60 shadow-[0_4px_20px_rgba(168,85,247,0.4)] backdrop-blur-md">
                <span className="text-[10px] font-black text-purple-300 px-0.5">🎯</span>
                <div className="flex items-center gap-1">
                  {state.players
                    .filter((p) => p.id !== controllingPlayerIndex)
                    .map((opp) => {
                      const isTarget = (selectedTargetOpponent ?? (controllingPlayerIndex + 1) % 4) === opp.id;
                      const cleanName = opp.name.replace('Bot ', '').replace(' 🤖', '');
                      return (
                        <button
                          key={opp.id}
                          type="button"
                          onClick={() => setSelectedTargetOpponent(opp.id)}
                          className={`px-1.5 py-0.5 rounded-lg text-[9px] font-black border transition cursor-pointer flex items-center gap-0.5 ${
                            isTarget
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-white shadow-sm scale-105'
                              : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
                          }`}
                          title={`Bersaglia ${cleanName}`}
                        >
                          <span className={SUIT_INFO[opp.suit].neonText}>{SUIT_INFO[opp.suit].symbol}</span>
                          <span className="max-w-[42px] truncate">{cleanName}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {!canLocalUserAct ? (
              <div className="h-full rounded-2xl bg-gradient-to-b from-[#140b26]/90 to-[#0c061a]/95 border border-purple-500/30 p-2 flex flex-col items-center justify-center text-center gap-1.5 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[9px] font-extrabold text-cyan-300 uppercase tracking-wider">
                    {isControllingPlayerAI ? 'Bot al Tavolo' : 'In Attesa'}
                  </span>
                  <span className="text-xs sm:text-[13px] font-black text-white truncate max-w-[130px] mt-0.5">
                    {controllingPlayer.name.replace(' 🤖', '')}
                  </span>
                </div>
              </div>
            ) : (
              <>
                {state.mode === 'NEUTRAL_FLOW' && (() => {
                  const labels = (() => {
                    if (!selectionValidation.valid || selectedCards.length === 0) {
                      return {
                        title: 'SCEGLI CARTA',
                        subtitle: 'Tocca per giocare',
                      };
                    }
                    if (needsOpponentPicker && selectedCards.length === 1) {
                      const effId = selectedTargetOpponent ?? (controllingPlayerIndex + 1) % 4;
                      const targetOpp = state.players.find((p) => p.id === effId);
                      const targetName = targetOpp ? targetOpp.name.replace('Bot ', '').replace(' 🤖', '') : '';
                      const sym = targetOpp ? SUIT_INFO[targetOpp.suit].symbol : '';
                      const c = selectedCards[0];
                      const powerName =
                        c.value === 11
                          ? 'SPIA CARTE 🕵️'
                          : c.value === 12
                          ? 'FARDELLO +2 👸'
                          : c.eventKind === 'DUEL_HIGH'
                          ? 'DUELLO ALTO ⚔️'
                          : 'DUELLO BASSO ⚔️';
                      return {
                        title: powerName,
                        subtitle: `🎯 Bersaglio: ${targetName} ${sym}`,
                      };
                    }
                    if (selectionValidation.isDirectSipsCombo && selectionValidation.targetSuit) {
                      const oppSym = SUIT_INFO[selectionValidation.targetSuit].symbol;
                      return {
                        title: `COLPO ${selectionValidation.sips}🍺`,
                        subtitle: `Bersaglio ${oppSym}`,
                      };
                    }
                    if (selectionValidation.isPassRightCombo) {
                      return {
                        title: 'SCAMBIA 🫱',
                        subtitle: 'Cedi carta',
                      };
                    }
                    if (selectedCards.length === 1) {
                      const c = selectedCards[0];
                      if (c.suit === controllingPlayer.suit) {
                        const sips = calculateBaseAttackSips(c.value, 1);
                        return {
                          title: `ATTACCA ${sips}🍺`,
                          subtitle: `Lancia ${c.label}${SUIT_INFO[c.suit].symbol}`,
                        };
                      }
                      return {
                        title: `GIOCA ${c.label}${SUIT_INFO[c.suit].symbol}`,
                        subtitle: 'Cambia a terra',
                      };
                    }
                    if (selectedCards.length > 1) {
                      return {
                        title: `COMBO x${selectedCards.length}`,
                        subtitle: `Lancia ${selectionValidation.sips || 2}🍺`,
                      };
                    }
                    return { title: 'GIOCA CARTA', subtitle: '' };
                  })();

                  if (selectedCards.length === 0) {
                    return (
                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'DRAW_AND_PASS' })}
                        className="w-full h-full p-2 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-500 active:scale-95 border-2 border-emerald-300/50 text-white font-black shadow-xl shadow-emerald-950/70 flex flex-col items-center justify-center gap-1 cursor-pointer transition animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                          <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-center justify-center leading-tight text-center">
                          <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
                            PESCA E PASSA
                          </span>
                          <span className="text-[9px] font-extrabold uppercase text-emerald-200 mt-0.5">
                            +1 Carta & Chiudi Turno
                          </span>
                        </div>
                        <span className="text-[8px] font-medium text-emerald-100/75 text-center leading-none mt-0.5">
                          oppure tocca una carta
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div className="w-full h-full flex flex-col justify-between gap-1">
                      <button
                        type="button"
                        disabled={!selectionValidation.valid}
                        onClick={handlePlaySelected}
                        className={`w-full flex-1 py-1 px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg ${
                          selectionValidation.valid
                            ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:brightness-110 text-white font-black shadow-rose-600/40 border border-white/30 cursor-pointer'
                            : 'bg-white/10 border border-white/15 text-slate-300 font-bold opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <Swords
                          className={`w-4 h-4 shrink-0 ${
                            selectionValidation.valid ? 'text-amber-300 animate-pulse' : 'text-slate-400'
                          }`}
                        />
                        <div className="flex flex-col items-center justify-center leading-tight text-center min-w-0">
                          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide truncate max-w-full">
                            {labels.title}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] font-bold leading-none mt-0.5 truncate max-w-full ${
                              selectionValidation.valid ? 'text-amber-200' : 'text-slate-400'
                            }`}
                          >
                            {labels.subtitle}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'DRAW_AND_PASS' })}
                        className="w-full h-7 px-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 border border-emerald-400/40 text-white font-black shadow-sm flex items-center justify-center gap-1 cursor-pointer transition shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-200" />
                        <span className="text-[9px] font-extrabold uppercase text-white">
                          Pesca invece (+1)
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {state.mode === 'ATTACK_CHAIN' && (() => {
                  const labels = (() => {
                    if (!selectionValidation.valid || selectedCards.length === 0) {
                      return {
                        title: 'SCEGLI DIFESA',
                        subtitle: 'Tocca una risposta',
                      };
                    }
                    const c = selectedCards[0];
                    if (c.eventKind === 'MIRROR') {
                      return {
                        title: 'SPECCHIO 🪞',
                        subtitle: `Rimanda x2 (${state.currentSips * 2}🍺)`,
                      };
                    }
                    if (c.eventKind === 'STOP_SUIT') {
                      return {
                        title: 'STOP 🚫',
                        subtitle: '0 sorsi (annulla)',
                      };
                    }
                    if (c.value === state.topCard.value) {
                      return {
                        title: `SHOCK ⚡`,
                        subtitle: '1 sorso a testa',
                      };
                    }
                    if (c.suit === state.topCard.suit && c.value > state.topCard.value) {
                      return {
                        title: `SCUDO 🛡️`,
                        subtitle: '0 sorsi (alta)',
                      };
                    }
                    return {
                      title: `RISPONDI ↩️`,
                      subtitle: `${c.label}${SUIT_INFO[c.suit].symbol}`,
                    };
                  })();

                  if (selectedCards.length === 0) {
                    return (
                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'TAKE_SIPS' })}
                        className="w-full h-full p-2 rounded-2xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-600 hover:brightness-110 active:scale-95 border-2 border-amber-300 text-white font-black shadow-xl shadow-rose-950/70 flex flex-col items-center justify-center gap-1 cursor-pointer transition animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-400/30 border border-amber-300/50 flex items-center justify-center shadow-inner">
                          <Beer className="w-5 h-5 text-amber-300 animate-bounce" />
                        </div>
                        <div className="flex flex-col items-center justify-center leading-tight text-center">
                          <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
                            INCASSA E BEVI
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-amber-200 mt-0.5">
                            Bevi {state.currentSips}🍺 Sorsi
                          </span>
                        </div>
                        <span className="text-[8px] font-medium text-amber-100/75 text-center leading-none mt-0.5">
                          oppure tocca una difesa
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div className="w-full h-full flex flex-col justify-between gap-1">
                      <button
                        type="button"
                        disabled={!selectionValidation.valid}
                        onClick={handlePlaySelected}
                        className={`w-full flex-1 py-1 px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg ${
                          selectionValidation.valid
                            ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:brightness-110 text-slate-950 font-black shadow-cyan-400/40 border border-white/50 cursor-pointer'
                            : 'bg-white/10 border border-white/15 text-slate-300 font-bold opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <ArrowLeftRight
                          className={`w-4 h-4 shrink-0 ${
                            selectionValidation.valid ? 'text-slate-950 animate-bounce' : 'text-slate-400'
                          }`}
                        />
                        <div className="flex flex-col items-center justify-center leading-tight text-center min-w-0">
                          <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wide truncate max-w-full ${selectionValidation.valid ? 'text-slate-950' : 'text-white'}`}>
                            {labels.title}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] font-extrabold leading-none mt-0.5 truncate max-w-full ${
                              selectionValidation.valid ? 'text-emerald-950' : 'text-slate-400'
                            }`}
                          >
                            {labels.subtitle}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'TAKE_SIPS' })}
                        className="w-full h-7 px-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 active:scale-95 border border-amber-400/40 text-white font-black shadow-sm flex items-center justify-center gap-1 cursor-pointer transition shrink-0"
                      >
                        <Beer className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-[9px] font-extrabold uppercase text-amber-200">
                          Incassa ({state.currentSips}🍺)
                        </span>
                      </button>
                    </div>
                  );
                })()}

                {state.mode === 'SPECIAL_EVENT' && state.specialEvent && (() => {
                  if (
                    state.specialEvent.type === 'QUEEN_BURDEN' &&
                    state.specialEvent.phase === 'SELECTING_REDIRECT_TARGET'
                  ) {
                    return null;
                  }

                  const labels = (() => {
                    if (!selectionValidation.valid || selectedCards.length === 0) {
                      return {
                        title: 'SCEGLI RISPOSTA',
                        subtitle: 'Tocca per reagire',
                      };
                    }
                    const c = selectedCards[0];
                    if (c.eventKind === 'MIRROR') {
                      return {
                        title: 'SPECCHIO 🪞',
                        subtitle: 'Rimanda sorsi',
                      };
                    }
                    return {
                      title: `RISPONDI ${c.label}`,
                      subtitle: 'Reazione evento',
                    };
                  })();

                  const passLabels = (() => {
                    const ev = state.specialEvent!;
                    if (ev.type === 'DIRECT_SIPS_ATTACK') {
                      return { title: 'INCASSA', subtitle: `Bevi ${ev.sipsAmount}🍺` };
                    }
                    if (ev.type === 'ACE_CASCADE') {
                      return { title: 'PENALITÀ', subtitle: 'Bevi 2🍺 + Pesca' };
                    }
                    if (ev.type === 'KING_TOAST') {
                      return { title: 'BRINDA', subtitle: 'Bevi 1🍺' };
                    }
                    if (ev.type === 'QUEEN_BURDEN') {
                      return { title: 'SUBISCI', subtitle: 'Pesca +2 Carte' };
                    }
                    return { title: 'PASSA', subtitle: 'Turno' };
                  })();

                  if (selectedCards.length === 0) {
                    return (
                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'RESOLVE_SPECIAL_PASS' })}
                        className="w-full h-full p-2 rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-rose-600 hover:brightness-110 active:scale-95 border-2 border-purple-300 text-white font-black shadow-xl shadow-purple-950/70 flex flex-col items-center justify-center gap-1 cursor-pointer transition animate-pulse"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-inner">
                          <CornerDownRight className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-center justify-center leading-tight text-center">
                          <span className="text-xs sm:text-[13px] font-black uppercase tracking-wider text-white">
                            {passLabels.title}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-purple-200 mt-0.5">
                            {passLabels.subtitle}
                          </span>
                        </div>
                        <span className="text-[8px] font-medium text-purple-100/75 text-center leading-none mt-0.5">
                          oppure tocca una risposta
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div className="w-full h-full flex flex-col justify-between gap-1">
                      <button
                        type="button"
                        disabled={!selectionValidation.valid}
                        onClick={handlePlaySelected}
                        className={`w-full flex-1 py-1 px-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg ${
                          selectionValidation.valid
                            ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 hover:brightness-110 text-white font-black shadow-purple-600/40 border border-white/30 cursor-pointer'
                            : 'bg-white/10 border border-white/15 text-slate-300 font-bold opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles
                          className={`w-4 h-4 shrink-0 ${
                            selectionValidation.valid ? 'text-amber-300 animate-spin' : 'text-slate-400'
                          }`}
                        />
                        <div className="flex flex-col items-center justify-center leading-tight text-center min-w-0">
                          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wide truncate max-w-full">
                            {labels.title}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] font-extrabold leading-none mt-0.5 truncate max-w-full ${
                              selectionValidation.valid ? 'text-amber-200' : 'text-slate-400'
                            }`}
                          >
                            {labels.subtitle}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchAction({ type: 'RESOLVE_SPECIAL_PASS' })}
                        className="w-full h-7 px-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 active:scale-95 border border-rose-400/40 text-white font-black shadow-sm flex items-center justify-center gap-1 cursor-pointer transition shrink-0"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-white" />
                        <span className="text-[9px] font-extrabold uppercase text-rose-200">
                          {passLabels.title} ({passLabels.subtitle})
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {showBonusModal && bonusCards.length > 0 && (
        <TargetBonusModal
          bonusCards={bonusCards}
          activePlayer={controllingPlayer}
          players={state.players}
          targetCard={state.targetCard}
          onConfirm={(cardId, sipDistribution) => {
            dispatchAction({ type: 'USE_TARGET_BONUS', cardId, sipDistribution });
            setShowBonusModal(false);
          }}
          onClose={() => setShowBonusModal(false)}
        />
      )}

      {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}

      <LobbyHubModal
        isOpen={showLobbyModal}
        onClose={() => setShowLobbyModal(false)}
        currentPreset={currentPreset}
        playerNames={playerNames}
        aiFlags={aiFlags}
        clientPlayerId={clientPlayerId}
        activeLobby={activeLobby}
        initialTab={initialOpenLobbyTab || undefined}
        onStartLocalPreset={handleStartLocalPreset}
        onLobbyJoinedOrUpdated={(room) => {
          setActiveLobby(room);
          if (room.gameState) {
            dispatchLocal({ type: 'SYNC_STATE', nextState: room.gameState });
          }
        }}
        onLeaveLobby={() => {
          setActiveLobby(null);
        }}
      />

      {activeLobby && (
        <QrCodeModal
          isOpen={showQuickQrModal}
          onClose={() => setShowQuickQrModal(false)}
          roomCode={activeLobby.code}
          roomName={activeLobby.roomName}
        />
      )}

      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md max-h-[75vh] flex flex-col rounded-3xl bg-[#120b22] border border-white/15 p-5 text-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black uppercase tracking-wider text-rose-400">
                Cronologia Faida ({state.logs.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowLogs(false)}
                className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold cursor-pointer"
              >
                Chiudi
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {state.logs.map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200"
                >
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <DuelModal
        activeDuel={state.activeDuel}
        onDismiss={() => dispatchAction({ type: 'DISMISS_DUEL' })}
      />

      <DrinkAlertModal
        alert={drinkAlert}
        onDismiss={() => setDrinkAlert(null)}
      />

      <TurnAlertModal
        alert={turnAlert}
        onDismiss={() => setTurnAlert(null)}
      />

      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard.card}
          playerSuit={displayedHandPlayer.suit}
          playability={getCardPlayability(state, controllingPlayerIndex, inspectedCard.card)}
          isTopCard={inspectedCard.isTopCard}
          onClose={() => setInspectedCard(null)}
          onPlayCard={(c) => {
            setInspectedCard(null);
            if (canLocalUserAct) {
              dispatchAction({
                type: 'PLAY_CARDS',
                cardIds: [c.id],
                targetPlayerIndex: selectedTargetOpponent ?? (controllingPlayerIndex + 1) % 4,
              });
              setSelectedCardIds([]);
            }
          }}
        />
      )}

      {state.mode === 'GAME_OVER' && state.winnerIndex !== null && (
        <VictoryModal
          players={state.players}
          winnerIndex={state.winnerIndex}
          onPlayAgain={() => {
            if (activeLobby) {
              fetch(`/api/lobbies/${activeLobby.code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operation: 'start' }),
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data.room?.gameState) {
                    setActiveLobby(data.room);
                    dispatchLocal({ type: 'SYNC_STATE', nextState: data.room.gameState });
                  }
                });
            } else {
              handleStartLocalPreset(currentPreset, playerNames, aiFlags);
            }
          }}
        />
      )}
    </div>
  );
}
