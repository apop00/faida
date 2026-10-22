import {
  ActiveDuelParticipant,
  ActiveDuelState,
  ActiveReflexState,
  Card,
  CardPlayability,
  CustomDeckConfig,
  DEFAULT_DECK_CONFIG,
  Direction,
  GameAction,
  GameLogEntry,
  GameState,
  Player,
  ReflexParticipant,
  Suit,
} from '@/types/game';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_INFO: Record<
  Suit,
  {
    name: string;
    factionName: string;
    symbol: string;
    color: string;
    neonText: string;
    neonBorder: string;
    neonBg: string;
    badgeBg: string;
  }
> = {
  hearts: {
    name: 'Cuori',
    factionName: 'Casata Cuori',
    symbol: '♥',
    color: '#f43f5e',
    neonText: 'text-rose-400',
    neonBorder: 'border-rose-500/60',
    neonBg: 'from-rose-950/80 to-slate-950/90',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  diamonds: {
    name: 'Quadri',
    factionName: 'Gilda Quadri',
    symbol: '♦',
    color: '#f59e0b',
    neonText: 'text-amber-400',
    neonBorder: 'border-amber-500/60',
    neonBg: 'from-amber-950/80 to-slate-950/90',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  clubs: {
    name: 'Fiori',
    factionName: 'Ordine Fiori',
    symbol: '♣',
    color: '#10b981',
    neonText: 'text-emerald-400',
    neonBorder: 'border-emerald-500/60',
    neonBg: 'from-emerald-950/80 to-slate-950/90',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  spades: {
    name: 'Picche',
    factionName: 'Legione Picche',
    symbol: '♠',
    color: '#06b6d4',
    neonText: 'text-cyan-400',
    neonBorder: 'border-cyan-500/60',
    neonBg: 'from-cyan-950/80 to-slate-950/90',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
};

export function getCardLabel(value: number): string {
  switch (value) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return String(value);
  }
}

/**
 * Circular sequence: K (13) <-> A (1) <-> 2
 */
export function getNextValue(value: number): number {
  return value === 13 ? 1 : value + 1;
}

export function getPrevValue(value: number): number {
  return value === 1 ? 13 : value - 1;
}

/**
 * Computes the next player index based on current turn direction ('forward' clockwise vs 'backward' counter-clockwise)
 */
export function getNextTurnIndex(
  currentIndex: number,
  direction: Direction = 'forward',
  steps: number = 1
): number {
  const normalizedSteps = ((steps % 4) + 4) % 4;
  if (direction === 'backward') {
    return (currentIndex - normalizedSteps + 4) % 4;
  }
  return (currentIndex + normalizedSteps) % 4;
}

/**
 * Creates the full 87-card deck:
 * - 52 standard French cards (A..K across 4 suits)
 * - 11 Direct Sip Event Cards (4x 1🍺, 4x 2🍺, 2x 3🍺, 1x 5🍺)
 * - 4 Cambio Giro Event Cards (1 per suit)
 * - 8 Stop Event Cards (4 in initial hands + 4 in deck)
 * - 2 Specchio Event Cards (🪞)
 * - 1 Tassa sui Ricchi Event Card (📉)
 * - 4 Duello 1v1 Event Cards (2x ⚔️▲ Carta Alta, 2x ⚔️▼ Carta Bassa)
 * - 2 Super Duello Tutti Event Cards (1x 💥▲ Carta Alta, 1x 💥▼ Carta Bassa)
 * - 1 Scambio a Destra Event Card
 * - 1 Rossi +2 Carte Event Card
 * - 1 Neri +2 Carte Event Card
 * - 1 Tutti +1 Carta Event Card
 */
export function createDeck(config?: CustomDeckConfig): Card[] {
  const cfg = { ...DEFAULT_DECK_CONFIG, ...config };
  const deck: Card[] = [];

  // 1. 52 Standard Cards (2..10 always, Face cards configurable)
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      if (value === 1 && !cfg.includeAces) continue;
      if (value === 11 && !cfg.includeJacks) continue;
      if (value === 12 && !cfg.includeQueens) continue;
      if (value === 13 && !cfg.includeKings) continue;

      deck.push({
        id: `${suit}-${value}`,
        suit,
        value,
        label: getCardLabel(value),
      });
    }
  }

  // 2. 11 Direct Sip Event Cards (played on opponent's suit on table)
  if (cfg.includeDirectSips) {
    // 4x 1 Sorso
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `event-sip1-${i + 1}`,
        suit: SUITS[i],
        value: 0,
        label: '1🍺',
        eventKind: 'DIRECT_SIPS',
        sipsAmount: 1,
      });
    }
    // 4x 2 Sorsi
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `event-sip2-${i + 1}`,
        suit: SUITS[i],
        value: 0,
        label: '2🍺',
        eventKind: 'DIRECT_SIPS',
        sipsAmount: 2,
      });
    }
    // 2x 3 Sorsi
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `event-sip3-${i + 1}`,
        suit: SUITS[i],
        value: 0,
        label: '3🍺',
        eventKind: 'DIRECT_SIPS',
        sipsAmount: 3,
      });
    }
    // 1x 5 Sorsi
    deck.push({
      id: `event-sip5-1`,
      suit: 'spades',
      value: 0,
      label: '5🍺',
      eventKind: 'DIRECT_SIPS',
      sipsAmount: 5,
    });
  }

  // 3. 4x Cambio Giro with Suits
  if (cfg.includeReverse) {
    for (const suit of SUITS) {
      deck.push({
        id: `event-reverse-${suit}`,
        suit,
        value: 0,
        label: '🔄',
        eventKind: 'REVERSE_SUIT',
      });
    }
  }

  // 4. 8x Stop with Suits (4 given 1 per player in initial hand + 4 in the draw deck - solo paracolpi/difesa)
  if (cfg.includeStop) {
    for (const suit of SUITS) {
      deck.push({
        id: `event-stop-${suit}`,
        suit,
        value: 0,
        label: '🚫',
        eventKind: 'STOP_SUIT',
      });
      deck.push({
        id: `event-stop-deck-${suit}`,
        suit,
        value: 0,
        label: '🚫',
        eventKind: 'STOP_SUIT',
      });
    }
  }

  // 4b. 4x Salta Turno (1 per seme: ♥, ♦, ♣, ♠) - fa saltare il turno al prossimo, solo Specchio risponde
  if (cfg.includeSkip) {
    for (const suit of SUITS) {
      deck.push({
        id: `event-skip-${suit}`,
        suit,
        value: 0,
        label: '⏭️',
        eventKind: 'SKIP_TURN',
      });
    }
  }

  // 5. 1x Scambio 1 Carta a Destra + Pescate di Fazione
  if (cfg.includeDrawSwap) {
    deck.push({
      id: 'event-pass-right',
      suit: 'hearts',
      value: 0,
      label: '🫱',
      eventKind: 'PASS_RIGHT',
    });
    deck.push({
      id: 'event-red-draw-2',
      suit: 'hearts',
      value: 0,
      label: '♥♦+2',
      eventKind: 'RED_DRAW_2',
    });
    deck.push({
      id: 'event-black-draw-2',
      suit: 'spades',
      value: 0,
      label: '♣♠+2',
      eventKind: 'BLACK_DRAW_2',
    });
    deck.push({
      id: 'event-all-draw-1',
      suit: 'clubs',
      value: 0,
      label: '🃏+1',
      eventKind: 'ALL_DRAW_1',
    });
  }

  // 9. 2x Specchio (riflette attacchi e Sorsi Diretti)
  if (cfg.includeMirror) {
    deck.push({
      id: 'event-mirror-1',
      suit: 'diamonds',
      value: 0,
      label: '🪞',
      eventKind: 'MIRROR',
    });
    deck.push({
      id: 'event-mirror-2',
      suit: 'clubs',
      value: 0,
      label: '🪞',
      eventKind: 'MIRROR',
    });
  }

  // 10. 1x Tassa sui Ricchi (chi ha meno carte pesca +2 e beve 1 sorso)
  if (cfg.includeTaxRich) {
    deck.push({
      id: 'event-tax-rich',
      suit: 'diamonds',
      value: 0,
      label: '📉',
      eventKind: 'TAX_RICH',
    });
  }

  // 11. 4x Duello 1v1 (2x Carta Alta, 2x Carta Bassa - solo carte da 2 a 10)
  if (cfg.includeDuel) {
    deck.push({
      id: 'event-duel-high-1',
      suit: 'hearts',
      value: 0,
      label: '⚔️▲',
      eventKind: 'DUEL_HIGH',
    });
    deck.push({
      id: 'event-duel-high-2',
      suit: 'spades',
      value: 0,
      label: '⚔️▲',
      eventKind: 'DUEL_HIGH',
    });
    deck.push({
      id: 'event-duel-low-1',
      suit: 'diamonds',
      value: 0,
      label: '⚔️▼',
      eventKind: 'DUEL_LOW',
    });
    deck.push({
      id: 'event-duel-low-2',
      suit: 'clubs',
      value: 0,
      label: '⚔️▼',
      eventKind: 'DUEL_LOW',
    });
  }

  // 12. 2x Super Duello con Tutti (1x Carta Alta, 1x Carta Bassa - solo carte da 2 a 10)
  if (cfg.includeSuperDuel) {
    deck.push({
      id: 'event-super-duel-high',
      suit: 'hearts',
      value: 0,
      label: '💥▲',
      eventKind: 'SUPER_DUEL_HIGH',
    });
    deck.push({
      id: 'event-super-duel-low',
      suit: 'spades',
      value: 0,
      label: '💥▼',
      eventKind: 'SUPER_DUEL_LOW',
    });
  }

  // 13. 4x Riflessi da Tavolo (1 per seme: ♥, ♦, ♣, ♠) - Mini-gioco lampo 2s
  if (cfg.includeReflex) {
    for (const suit of SUITS) {
      deck.push({
        id: `event-reflex-${suit}`,
        suit,
        value: 0,
        label: '⚡🎯',
        eventKind: 'TABLE_REFLEX',
      });
    }
  }

  return deck;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function calculateBaseAttackSips(_value: number, comboCount: number = 1): number {
  return Math.min(4, Math.max(1, comboCount));
}

function makeLog(
  text: string,
  type: GameLogEntry['type'] = 'info'
): GameLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    text,
    type,
  };
}

export function drawCardsFromDeck(
  deck: Card[],
  discardPile: Card[],
  count: number
): { drawn: Card[]; newDeck: Card[]; newDiscardPile: Card[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length === 0) {
      if (currentDiscard.length === 0) break;
      currentDeck = shuffleDeck(currentDiscard);
      currentDiscard = [];
    }
    const nextCard = currentDeck.shift();
    if (nextCard) {
      drawn.push(nextCard);
    }
  }

  return {
    drawn,
    newDeck: currentDeck,
    newDiscardPile: currentDiscard,
  };
}

/**
 * Extracts `count` numeric cards with values strictly between 2 and 10
 * from the deck/discard (putting the revealed duel cards into the discard pile).
 * Ties can naturally occur when cards with identical values are drawn.
 */
export function drawDuelNumericCards(
  deck: Card[],
  discardPile: Card[],
  count: number
): { duelCards: Card[]; newDeck: Card[]; newDiscardPile: Card[] } {
  let currentDeck = [...deck];
  let currentDiscard = [...discardPile];
  const duelCards: Card[] = [];

  for (let i = 0; i < count; i++) {
    let idx = currentDeck.findIndex(
      (c) => !c.eventKind && c.value >= 2 && c.value <= 10
    );

    if (idx === -1 && currentDiscard.length > 0) {
      currentDeck = [...currentDeck, ...shuffleDeck(currentDiscard)];
      currentDiscard = [];
      idx = currentDeck.findIndex(
        (c) => !c.eventKind && c.value >= 2 && c.value <= 10
      );
    }

    if (idx >= 0) {
      const [picked] = currentDeck.splice(idx, 1);
      duelCards.push(picked);
      currentDiscard.push(picked);
    } else {
      const val = Math.floor(Math.random() * 9) + 2;
      const suit = SUITS[i % 4];
      duelCards.push({
        id: `duel-virtual-${Date.now()}-${i}`,
        suit,
        value: val,
        label: String(val),
      });
    }
  }

  return {
    duelCards,
    newDeck: currentDeck,
    newDiscardPile: currentDiscard,
  };
}

export function isDuelNumericCard(c: Card): boolean {
  return !c.eventKind && c.value >= 2 && c.value <= 10;
}

export function pickBestDuelCard(hand: Card[], isHigh: boolean): Card | null {
  const eligible = hand.filter(isDuelNumericCard);
  if (eligible.length === 0) return null;
  return [...eligible].sort((a, b) => (isHigh ? b.value - a.value : a.value - b.value))[0];
}

export function resolveDuelVerdict(
  duelKind: 'DUEL_HIGH' | 'DUEL_LOW' | 'SUPER_DUEL_HIGH' | 'SUPER_DUEL_LOW',
  participants: ActiveDuelParticipant[]
): {
  loserIndices: number[];
  primaryLoserIdx: number;
  isTie: boolean;
} {
  const isHigh = duelKind === 'DUEL_HIGH' || duelKind === 'SUPER_DUEL_HIGH';

  // Rule: If any player has no card (hasNoCard === true or !card), they lose automatically!
  const forfeiting = participants.filter((p) => p.hasNoCard || !p.card);
  if (forfeiting.length > 0) {
    const loserIndices = forfeiting.map((p) => p.player.id);
    return {
      loserIndices,
      primaryLoserIdx: loserIndices[0],
      isTie: loserIndices.length > 1,
    };
  }

  // All participants have a card
  const cards = participants.map((p) => ({
    playerId: p.player.id,
    value: p.card!.value,
  }));

  const worstVal = isHigh
    ? Math.min(...cards.map((c) => c.value))
    : Math.max(...cards.map((c) => c.value));

  const loserIndices = cards
    .filter((c) => c.value === worstVal)
    .map((c) => c.playerId);

  return {
    loserIndices,
    primaryLoserIdx: loserIndices[0],
    isTie: loserIndices.length > 1,
  };
}

export function createInitialGameState(
  playerNames: string[] = ['Giocatore 1', 'Giocatore 2', 'Giocatore 3', 'Giocatore 4'],
  aiFlags: boolean[] = [false, false, false, false],
  deckConfig?: CustomDeckConfig
): GameState {
  const cfg = { ...DEFAULT_DECK_CONFIG, ...deckConfig };
  const allCards = createDeck(deckConfig);
  const initialStopIds = new Set(SUITS.map((s) => `event-stop-${s}`));
  const deckStopIds = new Set(SUITS.map((s) => `event-stop-deck-${s}`));
  const initialStopsBySuit = new Map<Suit, Card>();
  const deckStops: Card[] = [];
  const poolCards: Card[] = [];

  for (const c of allCards) {
    if (initialStopIds.has(c.id)) {
      initialStopsBySuit.set(c.suit, c);
    } else if (deckStopIds.has(c.id)) {
      deckStops.push(c);
    } else {
      poolCards.push(c);
    }
  }

  const shuffledPool = shuffleDeck(poolCards);

  // Each player starts with 8 cards:
  // If Stop is enabled: 1 guaranteed STOP card + 7 random cards from pool
  // If Stop is disabled: 8 random cards from pool
  const hasGuaranteedStops = cfg.includeStop && initialStopsBySuit.size === 4;
  const poolCardsPerPlayer = hasGuaranteedStops ? 7 : 8;

  const players: Player[] = SUITS.map((suit, index) => {
    const guaranteedStop = hasGuaranteedStops ? initialStopsBySuit.get(suit) : null;
    const dealtCards = shuffledPool.slice(index * poolCardsPerPlayer, (index + 1) * poolCardsPerPlayer);
    const hand = guaranteedStop ? [guaranteedStop, ...dealtCards] : dealtCards;
    return {
      id: index,
      name: playerNames[index] || `Giocatore ${index + 1}`,
      suit,
      hand: shuffleDeck(hand),
      sipsDrunk: 0,
      cardsDealtCount: 0,
      isAI: Boolean(aiFlags[index]),
      attacksLaunched: 0,
      defensesSucceeded: 0,
    };
  });

  const afterHands = shuffledPool.slice(poolCardsPerPlayer * 4);
  // Ensure initial TopCard is always a standard card (1..13)
  const targetIdxInPool = afterHands.findIndex((c) => !c.eventKind && c.value >= 1 && c.value <= 13);
  const resolvedIdx = targetIdxInPool >= 0 ? targetIdxInPool : 0;
  const targetCard = afterHands[resolvedIdx] || allCards[0];
  const remainingDeck = shuffleDeck([
    ...afterHands.filter((_, idx) => idx !== resolvedIdx),
    ...deckStops,
  ]);

  const starterIndex = SUITS.indexOf(targetCard.suit);

  return {
    deck: remainingDeck,
    discardPile: [],
    targetCard,
    topCard: targetCard,
    players,
    activePlayerIndex: starterIndex >= 0 ? starterIndex : 0,
    defenderIndex: null,
    mode: 'NEUTRAL_FLOW',
    currentSips: 0,
    timer: 7,
    lastDirection: 'forward',
    specialEvent: null,
    activeDuel: null,
    winnerIndex: null,
    lastDrinkEvent: null,
    deckConfig: cfg,
    lastActionBanner: {
      title: `Battesimo: ${targetCard.label}${SUIT_INFO[targetCard.suit].symbol}`,
      subtitle: `Inizia ${players[starterIndex]?.name} (${SUIT_INFO[targetCard.suit].name})`,
      tone: 'neutral',
    },
    logs: [
      makeLog(
        `Battesimo del Mazzo: estratto ${targetCard.label}${SUIT_INFO[targetCard.suit].symbol}. Primo turno a ${players[starterIndex]?.name}.`,
        'info'
      ),
    ],
  };
}

/**
 * Calcola quante carte da far pescare ha accumulato e ha a disposizione un giocatore
 * in base alla soglia sorsi (5 o 10) e a quante ne ha già utilizzate.
 */
export function getAvailableSipCards(
  player?: Player | null,
  threshold?: 'none' | 5 | 10
): number {
  if (!player || !threshold || threshold === 'none') return 0;
  const earned = Math.floor(player.sipsDrunk / threshold);
  const used = player.cardsDealtCount || 0;
  return Math.max(0, earned - used);
}

/**
 * Calcola l'avanzamento verso la prossima carta penalità sbloccabile
 */
export function getSipsProgressToNextCard(
  player?: Player | null,
  threshold?: 'none' | 5 | 10
): { currentInCycle: number; neededForNext: number } {
  if (!player || !threshold || threshold === 'none') {
    return { currentInCycle: 0, neededForNext: 0 };
  }
  const currentInCycle = player.sipsDrunk % threshold;
  const neededForNext = threshold - currentInCycle;
  return { currentInCycle, neededForNext };
}

/**
 * Returns which player currently has control of the hand / UI
 */
export function getControllingPlayerIndex(state: GameState): number {
  if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex !== null) {
    return state.defenderIndex;
  }
  if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
    const ev = state.specialEvent;
    if (ev.type === 'JACK_SPY') {
      return ev.phase === 'AWAITING_COUNTER' ? ev.targetIndex : ev.attackerIndex;
    }
    if (ev.type === 'QUEEN_BURDEN') {
      return ev.targetIndex;
    }
    if (ev.type === 'KING_TOAST') {
      return ev.responderIndex;
    }
    if (ev.type === 'ACE_CASCADE') {
      return ev.currentResponderIndex;
    }
    if (ev.type === 'DIRECT_SIPS_ATTACK') {
      return ev.targetIndex;
    }
  }
  return state.activePlayerIndex;
}

/**
 * Carta Bersaglio rimossa su richiesta: restituisce sempre array vuoto.
 */
export function getTargetBonusCards(_state: GameState, _playerIndex: number): Card[] {
  return [];
}

/**
 * Determines if a specific card is playable in the current state for the given player
 */
export function getCardPlayability(
  state: GameState,
  playerIndex: number,
  card: Card
): CardPlayability {
  if (state.mode === 'GAME_OVER') {
    return { playable: false };
  }

  const controllingIndex = getControllingPlayerIndex(state);
  if (playerIndex !== controllingIndex) {
    return { playable: false };
  }

  const player = state.players[playerIndex];
  if (!player) return { playable: false };

  const isLastCard = player.hand.length === 1;
  const isEventOnTop = Boolean(state.topCard.eventKind) || state.topCard.value === 0;
  const isLinkedToTop =
    isEventOnTop ||
    card.suit === state.topCard.suit ||
    (card.value > 0 && state.topCard.value > 0 && card.value === state.topCard.value);

  // 1. NEUTRAL FLOW
  if (state.mode === 'NEUTRAL_FLOW') {
    // --- EVENT CARDS IN NEUTRAL FLOW ---
    if (card.eventKind) {
      // Mini-gioco lampo "Riflessi da Tavolo" (⚡🎯): giocabile quando vuoi!
      // Se rimani senza carte quando tocca a te dovrai pescare (non puoi chiudere con un evento).
      if (card.eventKind === 'TABLE_REFLEX') {
        return {
          playable: true,
          actionType: 'EVENT_TABLE_REFLEX',
          badgeLabel: isLastCard ? 'Riflessi Lampo! ⚡🎯 (Pescherai dopo)' : 'Riflessi Lampo! ⚡🎯',
        };
      }

      // Regola "Colpo Finale": Non puoi vincere scartando una carta Evento come ultima carta!
      if (isLastCard) {
        return { playable: false };
      }

      if (card.eventKind === 'DIRECT_SIPS') {
        // Giocabile da sola (senza doppio scarto) se a terra c'è il seme di un avversario o un evento
        if (isEventOnTop || state.topCard.suit !== player.suit) {
          const targetSuit =
            state.topCard.suit === player.suit && isEventOnTop
              ? (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).find((s) => s !== player.suit)!
              : state.topCard.suit;
          return {
            playable: true,
            actionType: 'EVENT_DIRECT_SIPS',
            badgeLabel: `Colpisci ${SUIT_INFO[targetSuit].symbol} (${card.sipsAmount}🍺)`,
            sipsPreview: card.sipsAmount,
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'REVERSE_SUIT') {
        if (
          isEventOnTop ||
          card.suit === state.topCard.suit ||
          state.topCard.eventKind === 'REVERSE_SUIT'
        ) {
          return {
            playable: true,
            actionType: 'EVENT_REVERSE',
            badgeLabel: 'Cambio Giro 🔄',
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'STOP_SUIT') {
        if (
          isEventOnTop ||
          card.suit === state.topCard.suit ||
          state.topCard.eventKind === 'STOP_SUIT'
        ) {
          return {
            playable: true,
            actionType: 'EVENT_STOP',
            badgeLabel: 'Stop 🛑',
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'SKIP_TURN') {
        if (
          isEventOnTop ||
          card.suit === state.topCard.suit ||
          state.topCard.eventKind === 'SKIP_TURN'
        ) {
          return {
            playable: true,
            actionType: 'EVENT_SKIP_TURN',
            badgeLabel: 'Salta Turno ⏭️',
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'PASS_RIGHT') {
        return {
          playable: true,
          actionType: 'EVENT_PASS_RIGHT',
          badgeLabel: 'Scambia 🫱',
        };
      }

      if (card.eventKind === 'RED_DRAW_2') {
        if (isEventOnTop || state.topCard.suit === 'hearts' || state.topCard.suit === 'diamonds') {
          return {
            playable: true,
            actionType: 'EVENT_RED_DRAW_2',
            badgeLabel: 'Rossi +2🃏',
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'BLACK_DRAW_2') {
        if (isEventOnTop || state.topCard.suit === 'clubs' || state.topCard.suit === 'spades') {
          return {
            playable: true,
            actionType: 'EVENT_BLACK_DRAW_2',
            badgeLabel: 'Neri +2🃏',
          };
        }
        return { playable: false };
      }

      if (card.eventKind === 'ALL_DRAW_1') {
        return {
          playable: true,
          actionType: 'EVENT_ALL_DRAW_1',
          badgeLabel: 'Tutti +1 🃏',
        };
      }

      if (card.eventKind === 'TAX_RICH') {
        return {
          playable: true,
          actionType: 'EVENT_TAX_RICH',
          badgeLabel: 'Tassa 📉 (1🍺)',
        };
      }

      if (card.eventKind === 'DUEL_HIGH') {
        return {
          playable: true,
          actionType: 'EVENT_DUEL_HIGH',
          badgeLabel: 'Duello ▲ (2🍺)',
          sipsPreview: 2,
        };
      }

      if (card.eventKind === 'DUEL_LOW') {
        return {
          playable: true,
          actionType: 'EVENT_DUEL_LOW',
          badgeLabel: 'Duello ▼ (2🍺)',
          sipsPreview: 2,
        };
      }

      if (card.eventKind === 'SUPER_DUEL_HIGH') {
        return {
          playable: true,
          actionType: 'EVENT_SUPER_DUEL_HIGH',
          badgeLabel: 'Super ▲ (2🍺)',
          sipsPreview: 2,
        };
      }

      if (card.eventKind === 'SUPER_DUEL_LOW') {
        return {
          playable: true,
          actionType: 'EVENT_SUPER_DUEL_LOW',
          badgeLabel: 'Super ▼ (2🍺)',
          sipsPreview: 2,
        };
      }

      // MIRROR is only playable in defense or against Direct Sips
      return { playable: false };
    }

    // Power cards (A, J, Q, K): devono essere collegate alla carta a terra (stesso seme o stesso valore)
    // E non possono essere giocate come ultima carta per chiudere (Regola Colpo Finale: solo Attacco o Difesa)
    if (card.value === 1 || card.value >= 11) {
      if (isLastCard || !isLinkedToTop) {
        return { playable: false };
      }
      if (card.value === 1) {
        return {
          playable: true,
          actionType: 'POWER_ACE',
          badgeLabel: 'Cascata Semi 🌊',
        };
      }
      if (card.value === 11) {
        return {
          playable: true,
          actionType: 'POWER_JACK',
          badgeLabel: 'Spia Mano 🕵️',
        };
      }
      if (card.value === 12) {
        return {
          playable: true,
          actionType: 'POWER_QUEEN',
          badgeLabel: 'Fardello +2 👸',
        };
      }
      if (card.value === 13) {
        return {
          playable: true,
          actionType: 'POWER_KING',
          badgeLabel: 'Brindisi Re 👑 (1🍺)',
        };
      }
    }

    // Number cards 2-10:
    // 1) Own suit -> Innesco Attacco SOLO SE collegata alla carta a terra (stesso seme o stesso numero, o evento a terra)!
    if (card.suit === player.suit) {
      if (isLinkedToTop) {
        const sips = calculateBaseAttackSips(card.value, 1);
        return {
          playable: true,
          actionType: 'FACTION_ATTACK',
          badgeLabel: isLastCard ? `Colpo Finale! 🏆 (${sips}🍺)` : `Attacca (${sips}🍺)`,
          sipsPreview: sips,
        };
      }

      // Se non è direttamente collegata a topCard, controlliamo se il giocatore ha un'altra carta dello stesso valore che è collegata a topCard (per fare Coppia/Tris d'attacco)
      const hasLinkedCompanionSameValue = player.hand.some(
        (c) =>
          !c.eventKind &&
          c.id !== card.id &&
          c.value === card.value &&
          (isEventOnTop ||
            c.suit === state.topCard.suit ||
            (state.topCard.value > 0 && c.value === state.topCard.value))
      );
      if (hasLinkedCompanionSameValue) {
        return {
          playable: true,
          actionType: 'COMBO_COMPANION',
          badgeLabel: 'Combo (=)',
        };
      }

      return { playable: false };
    }

    // 2) Not own suit -> Scarto di Collegamento (must match suit OR value of topCard, oppure evento a terra)
    // Regola "Colpo Finale" aggiornata: Si PUÒ chiudere con una carta neutra numerica (2-10)!
    if (isLinkedToTop) {
      return {
        playable: true,
        actionType: 'LINK_DISCARD',
        badgeLabel: isLastCard ? 'Colpo Finale! 🏆' : 'Cambia Carta 🔗',
      };
    }

    // 3) Check if player holds ANOTHER card of the same value in their own suit AND at least one of those cards is linked to topCard for a Coppia/Tris combo
    const sameValueCards = player.hand.filter(
      (c) => !c.eventKind && c.value === card.value
    );
    const hasOwnSuitSameValue = sameValueCards.some((c) => c.suit === player.suit);
    const anySameValueLinkedToTop =
      isEventOnTop ||
      sameValueCards.some(
        (c) =>
          c.suit === state.topCard.suit ||
          (state.topCard.value > 0 && c.value === state.topCard.value)
      );
    if (hasOwnSuitSameValue && anySameValueLinkedToTop) {
      return {
        playable: true,
        actionType: 'COMBO_COMPANION',
        badgeLabel: 'Combo (=)',
      };
    }

    return { playable: false };
  }

  // 2. ATTACK CHAIN (Defense) - Tutte le difese sono valide anche come "Colpo Finale"!
  if (state.mode === 'ATTACK_CHAIN') {
    // Stop Event Card can be played in defense to block the attack!
    if (card.eventKind === 'STOP_SUIT') {
      return {
        playable: true,
        actionType: 'DEFENSE_STOP',
        badgeLabel: 'Para Stop (0🍺)',
        sipsPreview: 0,
      };
    }

    // Specchio Event Card reflects the attack back to the attacker with x2 sips!
    if (card.eventKind === 'MIRROR') {
      const reflectedSips = state.currentSips * 2;
      return {
        playable: true,
        actionType: 'DEFENSE_MIRROR',
        badgeLabel: `Specchio x2 (${reflectedSips}🍺)`,
        sipsPreview: reflectedSips,
      };
    }

    // Mini-gioco lampo "Riflessi da Tavolo" (⚡🎯): attivabile quando vuoi, anche sotto attacco!
    if (card.eventKind === 'TABLE_REFLEX') {
      return {
        playable: true,
        actionType: 'EVENT_TABLE_REFLEX',
        badgeLabel: 'Riflessi Lampo! ⚡🎯',
      };
    }

    if (card.eventKind) {
      return { playable: false };
    }

    const top = state.topCard;
    if (top.value > 0) {
      const prevVal = getPrevValue(top.value);
      const nextVal = getNextValue(top.value);

      // Contrattacco (Valore -1)
      if (card.value === prevVal) {
        const sameSuit = card.suit === top.suit;
        const nextSips = sameSuit ? state.currentSips * 2 : state.currentSips;
        return {
          playable: true,
          actionType: 'DEFENSE_COUNTER',
          badgeLabel: sameSuit ? `Contrattacca x2 (${nextSips}🍺)` : 'Contrattacca (-1)',
          sipsPreview: nextSips,
        };
      }

      // Deviazione (Valore +1)
      if (card.value === nextVal) {
        const sameSuit = card.suit === top.suit;
        const nextSips = sameSuit ? state.currentSips * 2 : state.currentSips;
        return {
          playable: true,
          actionType: 'DEFENSE_DEVIATE',
          badgeLabel: sameSuit ? `Devia x2 (${nextSips}🍺)` : 'Devia (+1)',
          sipsPreview: nextSips,
        };
      }

      // Contro-Shock (Stesso Numero)
      if (card.value === top.value) {
        return {
          playable: true,
          actionType: 'DEFENSE_SHOCK',
          badgeLabel: 'Contro-Shock (=)',
          sipsPreview: 1,
        };
      }

      // Muro di Scudo Più Rigido (Stesso Seme E valore strettamente PIÙ ALTO della carta d'attacco)
      if (card.suit === top.suit && card.value > top.value) {
        return {
          playable: true,
          actionType: 'DEFENSE_SHIELD',
          badgeLabel: 'Scudo Alto (0🍺)',
          sipsPreview: 0,
        };
      }
    }

    return { playable: false };
  }

  // 3. SPECIAL EVENT
  if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
    const ev = state.specialEvent;

    if (ev.type === 'DIRECT_SIPS_ATTACK') {
      if (card.eventKind === 'MIRROR') {
        const reflected = ev.sipsAmount * 2;
        return {
          playable: true,
          actionType: 'SPECIAL_COUNTER_MIRROR',
          badgeLabel: `Rifletti x2 (${reflected}🍺) 🪞`,
          sipsPreview: reflected,
        };
      }
      return { playable: false };
    }

    if (ev.type === 'SKIP_ATTACK') {
      if (card.eventKind === 'MIRROR') {
        return {
          playable: true,
          actionType: 'SPECIAL_COUNTER_MIRROR',
          badgeLabel: 'Rifletti Salto Turno 🪞',
        };
      }
      return { playable: false };
    }

    if (ev.type === 'JACK_SPY') {
      if (ev.phase === 'AWAITING_COUNTER') {
        if (!card.eventKind && card.value === 11) {
          return {
            playable: true,
            actionType: 'SPECIAL_COUNTER_JACK',
            badgeLabel: 'Ribalta Spia (J)',
          };
        }
        return { playable: false };
      } else {
        // SPYING_ATTACK: Attacker sees target's hand and can immediately attack them with any number card (2-10)
        if (!card.eventKind && card.value >= 2 && card.value <= 10) {
          const sips = calculateBaseAttackSips(card.value, 1);
          return {
            playable: true,
            actionType: 'SPY_DIRECT_ATTACK',
            badgeLabel: `Colpo Sicuro (${sips}🍺)`,
            sipsPreview: sips,
          };
        }
        return { playable: false };
      }
    }

    if (ev.type === 'QUEEN_BURDEN') {
      if (ev.phase === 'AWAITING_RESPONSE') {
        if (!card.eventKind && card.value === 12) {
          return {
            playable: true,
            actionType: 'SPECIAL_COUNTER_QUEEN',
            badgeLabel: 'Contro-Regina (Q)',
          };
        }
        if (!card.eventKind && card.value === 6 && card.suit === ev.playedCard.suit) {
          return {
            playable: true,
            actionType: 'SPECIAL_BEFFA_6',
            badgeLabel: 'Beffa del 6 (6)',
          };
        }
      }
      return { playable: false };
    }

    if (ev.type === 'KING_TOAST') {
      if (!card.eventKind && card.value === 13) {
        return {
          playable: true,
          actionType: 'SPECIAL_COUNTER_KING',
          badgeLabel: 'Regicidio (5🍺)',
        };
      }
      return { playable: false };
    }

    if (ev.type === 'ACE_CASCADE') {
      // Regola "Colpo Finale": Non puoi vincere scartando l'ultima carta durante la Cascata d'Asso!
      if (isLastCard) {
        return { playable: false };
      }
      if (card.suit === ev.cascadeSuit) {
        return {
          playable: true,
          actionType: 'SPECIAL_CASCADE_SUIT',
          badgeLabel: `Cascata (${SUIT_INFO[ev.cascadeSuit].symbol})`,
        };
      }
      return { playable: false };
    }
  }

  return { playable: false };
}

/**
 * Validates if a set of selected cards can be played together:
 * - Single card (must obey linked playability and Colpo Finale rule)
 * - Pass Right Combo (1 PASS_RIGHT card + 1 chosen card to pass to right neighbor)
 * - Attack Combo (Coppia or Tris of same numeric value 2-10 including own suit AND linked to topCard)
 */
export function validateCardSelection(
  state: GameState,
  playerIndex: number,
  cards: Card[]
): {
  valid: boolean;
  reason?: string;
  sips?: number;
  isCombo?: boolean;
  isDirectSipsCombo?: boolean;
  isPassRightCombo?: boolean;
  targetSuit?: Suit;
} {
  if (cards.length === 0) return { valid: false, reason: 'Nessuna carta selezionata' };

  const player = state.players[playerIndex];
  if (!player) return { valid: false };

  if (cards.length === 1) {
    const playability = getCardPlayability(state, playerIndex, cards[0]);
    if (playability.actionType === 'COMBO_COMPANION') {
      return {
        valid: false,
        reason: 'Seleziona insieme anche la carta collegata per lanciare la Coppia/Tris!',
      };
    }
    return {
      valid: playability.playable,
      sips: playability.sipsPreview,
      isCombo: false,
      isDirectSipsCombo: playability.actionType === 'EVENT_DIRECT_SIPS',
      targetSuit:
        playability.actionType === 'EVENT_DIRECT_SIPS'
          ? (state.topCard.suit === player.suit &&
            (Boolean(state.topCard.eventKind) || state.topCard.value === 0)
              ? (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).find((s) => s !== player.suit)!
              : state.topCard.suit)
          : undefined,
    };
  }

  // Check if it's a 2-card Pass Right Combo in NEUTRAL_FLOW
  if (
    cards.length === 2 &&
    state.mode === 'NEUTRAL_FLOW' &&
    state.activePlayerIndex === playerIndex
  ) {
    const passRightCard = cards.find((c) => c.eventKind === 'PASS_RIGHT');
    const cardToGive = cards.find((c) => c.id !== passRightCard?.id);
    if (passRightCard && cardToGive) {
      return {
        valid: true,
        isCombo: false,
        isPassRightCombo: true,
      };
    }
  }

  // Multi-select (2, 3 or 4 cards): allowed in NEUTRAL_FLOW (for Faction Attack) or SPYING_ATTACK
  if (cards.length > 4) {
    return { valid: false, reason: 'Puoi calare al massimo un Poker (4 carte)' };
  }

  if (cards.some((c) => Boolean(c.eventKind))) {
    return {
      valid: false,
      reason: 'Le carte evento non possono formare Coppie, Tris o Poker numerici',
    };
  }

  const firstVal = cards[0].value;
  if (firstVal < 2 || firstVal > 10) {
    return { valid: false, reason: 'Coppie e Tris sono validi solo con carte numeriche (2-10)' };
  }

  const allSameValue = cards.every((c) => c.value === firstVal);
  if (!allSameValue) {
    return { valid: false, reason: 'Tutte le carte della combo devono avere lo stesso valore' };
  }

  if (state.mode === 'NEUTRAL_FLOW' && state.activePlayerIndex === playerIndex) {
    const includesOwnSuit = cards.some((c) => c.suit === player.suit);
    if (!includesOwnSuit) {
      return {
        valid: false,
        reason: `La combo d'attacco deve includere la carta del tuo seme (${SUIT_INFO[player.suit].symbol})`,
      };
    }
    const isEventOnTop = Boolean(state.topCard.eventKind) || state.topCard.value === 0;
    const includesLinkedToTop =
      isEventOnTop ||
      cards.some(
        (c) =>
          c.suit === state.topCard.suit ||
          (state.topCard.value > 0 && c.value === state.topCard.value)
      );
    if (!includesLinkedToTop) {
      return {
        valid: false,
        reason: 'Almeno una carta della combo deve essere collegata per seme o numero alla carta a terra!',
      };
    }
    const sips = calculateBaseAttackSips(firstVal, cards.length);
    return { valid: true, sips, isCombo: true };
  }

  if (
    state.mode === 'SPECIAL_EVENT' &&
    state.specialEvent?.type === 'JACK_SPY' &&
    state.specialEvent.phase === 'SPYING_ATTACK' &&
    state.specialEvent.attackerIndex === playerIndex
  ) {
    const sips = calculateBaseAttackSips(firstVal, cards.length);
    return { valid: true, sips, isCombo: true };
  }

  return { valid: false, reason: 'Le combo sono permesse solo in fase di Attacco' };
}

function checkGameOver(state: GameState): GameState {
  const emptyPlayer = state.players.find((p) => p.hand.length === 0);
  if (emptyPlayer) {
    // Regola "Colpo Finale": Non si può vincere la partita chiudendo con carte evento o figure (A, J, Q, K)!
    // Si può vincere solo chiudendo con carte numeriche neutre (2-10) o difese valide.
    const isTopEvent = Boolean(state.topCard.eventKind) || state.topCard.value === 0;
    const isTopFigure = state.topCard.value === 1 || state.topCard.value > 10;
    if (isTopEvent || isTopFigure) {
      // Non vince! Quando tocca a questo giocatore, dovrà pescare dal mazzo
      return state;
    }

    return {
      ...state,
      mode: 'GAME_OVER',
      winnerIndex: emptyPlayer.id,
      defenderIndex: null,
      specialEvent: null,
      lastActionBanner: {
        title: `TRIONFO DI ${emptyPlayer.name.toUpperCase()}!`,
        subtitle: `La fazione ${SUIT_INFO[emptyPlayer.suit].name} ${SUIT_INFO[emptyPlayer.suit].symbol} ha chiuso con un Colpo Finale e vince la Faida!`,
        tone: 'special',
      },
      logs: [
        makeLog(
          `🏆 ${emptyPlayer.name} (${SUIT_INFO[emptyPlayer.suit].name}) è rimasto con 0 carte grazie a un Colpo Finale e vince la partita!`,
          'special'
        ),
        ...state.logs,
      ],
    };
  }
  return state;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_GAME': {
      const fresh = createInitialGameState(action.playerNames, action.aiFlags, action.deckConfig);
      if (action.customState) {
        return { ...fresh, ...action.customState };
      }
      return fresh;
    }

    case 'SYNC_STATE': {
      return action.nextState;
    }

    case 'DISMISS_DUEL': {
      return {
        ...state,
        activeDuel: null,
      };
    }

    case 'DISMISS_REFLEX': {
      return {
        ...state,
        activeReflex: null,
      };
    }

    case 'TAP_REFLEX_TARGET': {
      if (!state.activeReflex || state.activeReflex.phase === 'RESOLVED') return state;
      const ar = state.activeReflex;
      const pIdx = action.playerIndex;
      const tapTime = Math.min(ar.durationMs, Math.max(1, action.tapTimeMs));

      const updatedParticipants = ar.participants.map((pt) =>
        pt.playerIndex === pIdx
          ? { ...pt, tapped: true, tapTimeMs: tapTime }
          : pt
      );

      // Check if all players have tapped
      const allTapped = updatedParticipants.every((pt) => pt.tapped);
      if (!allTapped) {
        return {
          ...state,
          activeReflex: {
            ...ar,
            participants: updatedParticipants,
          },
        };
      }

      // If all tapped, resolve who is the slowest!
      const sorted = [...updatedParticipants].sort(
        (a, b) => (b.tapTimeMs || 0) - (a.tapTimeMs || 0)
      );
      const loserPt = sorted[0];
      const loserIdx = loserPt.playerIndex;
      const loserPlayer = state.players[loserIdx];

      // Loser drinks 1 sorso AND draws 1 penalty card from deck!
      const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
        state.deck,
        state.discardPile,
        1
      );

      const nextPlayers = state.players.map((p, idx) =>
        idx === loserIdx
          ? {
              ...p,
              hand: [...p.hand, ...drawn],
              sipsDrunk: p.sipsDrunk + 1,
            }
          : p
      );

      const nextActive = getNextTurnIndex(ar.initiatorIndex, state.lastDirection, 1);

      return {
        ...state,
        deck: newDeck,
        discardPile: newDiscardPile,
        players: nextPlayers,
        activePlayerIndex: nextActive,
        lastDrinkEvent: {
          drinkerIndex: loserIdx,
          drinkerName: loserPlayer.name,
          drinkerSuit: loserPlayer.suit,
          senderIndex: ar.initiatorIndex,
          senderName: state.players[ar.initiatorIndex].name,
          senderSuit: state.players[ar.initiatorIndex].suit,
          sips: 1,
          reason: 'Ultimo in Riflessi da Tavolo! ⚡',
          cardLabel: '⚡🎯',
          cardSuit: state.topCard.suit,
        },
        activeReflex: {
          ...ar,
          participants: updatedParticipants,
          phase: 'RESOLVED',
          loserIndex: loserIdx,
        },
        lastActionBanner: {
          title: `RIFLESSI: ${loserPlayer.name.toUpperCase()} È IL PIÙ LENTO (${loserPt.tapTimeMs}ms)!`,
          subtitle: `${loserPlayer.name} beve 1🍺 e pesca 1🃏 penitenza! Tocca a ${state.players[nextActive].name}.`,
          tone: 'drink',
        },
        logs: [
          makeLog(
            `⚡ Riflessi da Tavolo conclusi: ${loserPlayer.name} è stato il più lento (${loserPt.tapTimeMs}ms) e subisce 1 sorso e 1 carta penalità!`,
            'drink'
          ),
          ...state.logs,
        ],
      };
    }

    case 'RESOLVE_REFLEX_TIMEOUT': {
      if (!state.activeReflex || state.activeReflex.phase === 'RESOLVED') return state;
      const ar = state.activeReflex;

      // Find who didn't tap in time, or the slowest
      const untapped = ar.participants.filter((pt) => !pt.tapped);
      let loserIdx: number;
      let loserPt: ReflexParticipant;

      if (untapped.length > 0) {
        loserPt = untapped[0];
        loserIdx = loserPt.playerIndex;
      } else {
        const sorted = [...ar.participants].sort(
          (a, b) => (b.tapTimeMs || 0) - (a.tapTimeMs || 0)
        );
        loserPt = sorted[0];
        loserIdx = loserPt.playerIndex;
      }

      const loserPlayer = state.players[loserIdx];

      // Loser drinks 1 sorso AND draws 1 card from deck
      const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
        state.deck,
        state.discardPile,
        1
      );

      const nextPlayers = state.players.map((p, idx) =>
        idx === loserIdx
          ? {
              ...p,
              hand: [...p.hand, ...drawn],
              sipsDrunk: p.sipsDrunk + 1,
            }
          : p
      );

      const nextActive = getNextTurnIndex(ar.initiatorIndex, state.lastDirection, 1);

      return {
        ...state,
        deck: newDeck,
        discardPile: newDiscardPile,
        players: nextPlayers,
        activePlayerIndex: nextActive,
        lastDrinkEvent: {
          drinkerIndex: loserIdx,
          drinkerName: loserPlayer.name,
          drinkerSuit: loserPlayer.suit,
          senderIndex: ar.initiatorIndex,
          senderName: state.players[ar.initiatorIndex].name,
          senderSuit: state.players[ar.initiatorIndex].suit,
          sips: 1,
          reason: 'Tempo scaduto in Riflessi da Tavolo! ⚡',
          cardLabel: '⚡🎯',
          cardSuit: state.topCard.suit,
        },
        activeReflex: {
          ...ar,
          phase: 'RESOLVED',
          loserIndex: loserIdx,
          timeoutResolved: true,
        },
        lastActionBanner: {
          title: `RIFLESSI TEMPO SCADUTO: ${loserPlayer.name.toUpperCase()} BEVE E PESCA!`,
          subtitle: `${loserPlayer.name} non ha toccato in tempo il bersaglio: beve 1🍺 e pesca 1🃏!`,
          tone: 'drink',
        },
        logs: [
          makeLog(
            `⚡ Tempo scaduto per Riflessi da Tavolo! ${loserPlayer.name} non ha premuto entro 2 secondi e beve 1 sorso + pesca 1 carta!`,
            'drink'
          ),
          ...state.logs,
        ],
      };
    }

    case 'COMMIT_DUEL_CARD': {
      if (!state.activeDuel) return state;
      const ad = state.activeDuel;
      const humanIdx = state.players.findIndex((p) => !p.isAI);
      if (humanIdx === -1) return state;

      const humanP = state.players[humanIdx];
      const newCard = action.cardId ? humanP.hand.find((c) => c.id === action.cardId) : null;

      const newParticipants = ad.participants.map((pt) => {
        if (pt.player.id === humanIdx) {
          return {
            ...pt,
            card: newCard || null,
            hasNoCard: !newCard,
          };
        }
        return pt;
      });

      const verdict = resolveDuelVerdict(ad.duelKind, newParticipants);
      const prevLosers = ad.loserIndices;
      const nextLosers = verdict.loserIndices;

      const updatedPlayers = state.players.map((p) => {
        let sips = p.sipsDrunk;
        if (prevLosers.includes(p.id)) sips -= 2;
        if (nextLosers.includes(p.id)) sips += 2;
        return { ...p, sipsDrunk: Math.max(0, sips) };
      });

      return {
        ...state,
        players: updatedPlayers,
        activeDuel: {
          ...ad,
          phase: 'REVEALED',
          participants: newParticipants,
          loserIndex: verdict.primaryLoserIdx,
          loserIndices: verdict.loserIndices,
          isTie: verdict.isTie,
        },
      };
    }

    case 'USE_TARGET_BONUS': {
      // Carta Bersaglio rimossa
      return state;
    }

    case 'DEAL_SIP_PENALTY_CARD': {
      if (state.mode !== 'NEUTRAL_FLOW') return state;
      const activeIdx = state.activePlayerIndex;
      const activeP = state.players[activeIdx];
      const threshold = state.deckConfig?.sipRewardThreshold;
      const available = getAvailableSipCards(activeP, threshold);
      if (available <= 0) return state;

      const targetIdx = action.targetPlayerIndex;
      if (targetIdx === activeIdx || !state.players[targetIdx]) return state;
      const targetP = state.players[targetIdx];

      // Pescata forzata per il bersaglio dal mazzo
      const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
        state.deck,
        state.discardPile,
        1
      );

      const updatedPlayers = state.players.map((p, idx) => {
        if (idx === activeIdx) {
          return {
            ...p,
            cardsDealtCount: (p.cardsDealtCount || 0) + 1,
          };
        }
        if (idx === targetIdx) {
          return {
            ...p,
            hand: [...p.hand, ...drawn],
          };
        }
        return p;
      });

      return {
        ...state,
        deck: newDeck,
        discardPile: newDiscardPile,
        players: updatedPlayers,
        lastActionBanner: {
          title: 'Vendetta dei Sorsi! 🎯🃏',
          subtitle: `${activeP.name} costringe ${targetP.name} a pescare 1 carta!`,
          tone: 'special',
        },
        logs: [
          makeLog(
            `🎯 Vendetta dei Sorsi! ${activeP.name} (${activeP.sipsDrunk}🍺) scaglia una penalità e fa pescare 1 carta a ${targetP.name}!`,
            'special'
          ),
          ...state.logs,
        ],
      };
    }

    case 'DRINK_VOLUNTARY_SIP': {
      if (state.mode !== 'NEUTRAL_FLOW') return state;
      if (!state.deckConfig?.allowVoluntarySip) return state;
      const activeIdx = state.activePlayerIndex;
      const activeP = state.players[activeIdx];
      const threshold = state.deckConfig?.sipRewardThreshold;

      const prevEarned = threshold && threshold !== 'none' ? Math.floor(activeP.sipsDrunk / threshold) : 0;
      const nextSipsDrunk = activeP.sipsDrunk + 1;
      const nextEarned = threshold && threshold !== 'none' ? Math.floor(nextSipsDrunk / threshold) : 0;
      const unlockedNew = nextEarned > prevEarned;

      const updatedPlayers = state.players.map((p, idx) =>
        idx === activeIdx ? { ...p, sipsDrunk: nextSipsDrunk } : p
      );

      return {
        ...state,
        players: updatedPlayers,
        lastDrinkEvent: {
          drinkerIndex: activeIdx,
          drinkerName: activeP.name,
          drinkerSuit: activeP.suit,
          sips: 1,
          reason: 'Sorso Tattico Volontario',
        },
        lastActionBanner: {
          title: unlockedNew ? 'Sorso Tattico: SBLOCCO! 🍻' : 'Sorso Tattico! 🍺',
          subtitle: unlockedNew
            ? `${activeP.name} beve 1 sorso (${nextSipsDrunk}🍺) e sblocca +1 carta da far pescare!`
            : `${activeP.name} beve volontariamente 1 sorso (${nextSipsDrunk}🍺)`,
          tone: 'drink',
        },
        logs: [
          makeLog(
            unlockedNew
              ? `🍻 Sorso Tattico! ${activeP.name} beve 1 sorso volontario (${nextSipsDrunk}🍺) e raggiunge la soglia per far pescare 1 carta a un avversario!`
              : `🍺 Sorso Tattico: ${activeP.name} beve 1 sorso volontario (${nextSipsDrunk}🍺).`,
            'drink'
          ),
          ...state.logs,
        ],
      };
    }

    case 'DRAW_AND_PASS': {
      if (state.mode !== 'NEUTRAL_FLOW') return state;
      const activePlayer = state.players[state.activePlayerIndex];
      const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
        state.deck,
        state.discardPile,
        1
      );

      const updatedPlayers = state.players.map((p, idx) =>
        idx === state.activePlayerIndex ? { ...p, hand: [...p.hand, ...drawn] } : p
      );

      const nextActive = getNextTurnIndex(state.activePlayerIndex, state.lastDirection, 1);

      return {
        ...state,
        deck: newDeck,
        discardPile: newDiscardPile,
        players: updatedPlayers,
        activePlayerIndex: nextActive,
        timer: 7,
        lastActionBanner: {
          title: `${activePlayer.name} Pesca e Passa`,
          subtitle: `Tocca a ${state.players[nextActive].name} (${SUIT_INFO[state.players[nextActive].suit].symbol})`,
          tone: 'neutral',
        },
        logs: [
          makeLog(
            `${activePlayer.name} pesca 1 carta e passa il turno a ${state.players[nextActive].name}.`,
            'info'
          ),
          ...state.logs,
        ],
      };
    }

    case 'PLAY_CARDS': {
      const controllingIndex = getControllingPlayerIndex(state);
      const player = state.players[controllingIndex];
      if (!player) return state;

      const selectedCards = action.cardIds
        .map((id) => player.hand.find((c) => c.id === id))
        .filter((c): c is Card => Boolean(c));

      if (selectedCards.length === 0 || selectedCards.length !== action.cardIds.length) {
        return state;
      }

      const validation = validateCardSelection(state, controllingIndex, selectedCards);
      if (!validation.valid) return state;

      const removePlayedFromHand = (p: Player) => ({
        ...p,
        hand: p.hand.filter((c) => !action.cardIds.includes(c.id)),
      });

      // --- CASE A0: DIRECT SIPS (Carta Sorso giocata da sola sul seme avversario a terra o su evento) ---
      if (
        state.mode === 'NEUTRAL_FLOW' &&
        selectedCards.length === 1 &&
        selectedCards[0].eventKind === 'DIRECT_SIPS'
      ) {
        const sipCard = selectedCards[0];
        const sipsToGive = sipCard.sipsAmount || 1;
        const isEventOnTop = Boolean(state.topCard.eventKind) || state.topCard.value === 0;
        let targetSuit = state.topCard.suit;
        if (targetSuit === player.suit && isEventOnTop) {
          const otherSuits = (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).filter(
            (s) => s !== player.suit
          );
          targetSuit = otherSuits[0];
        }
        const targetPlayerIdx = SUITS.indexOf(targetSuit);
        const targetPlayer = state.players[targetPlayerIdx];
        const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

        const afterPlayPlayers = state.players.map((p, idx) =>
          idx === controllingIndex
            ? {
                ...removePlayedFromHand(p),
                attacksLaunched: (p.attacksLaunched || 0) + 1,
              }
            : p
        );

        const targetHasMirror = afterPlayPlayers[targetPlayerIdx]?.hand.some(
          (c) => c.eventKind === 'MIRROR'
        );

        // If target has a MIRROR card in hand, give them the chance to reflect the Direct Sips!
        if (targetHasMirror) {
          const playedOnSuitCard: Card = { ...sipCard, suit: targetSuit };
          const nextState: GameState = {
            ...state,
            players: afterPlayPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: playedOnSuitCard,
            mode: 'SPECIAL_EVENT',
            timer: 7,
            specialEvent: {
              type: 'DIRECT_SIPS_ATTACK',
              attackerIndex: controllingIndex,
              targetIndex: targetPlayerIdx,
              sipsAmount: sipsToGive,
              playedCard: playedOnSuitCard,
            },
            lastActionBanner: {
              title: `COLPO DIRETTO: ${sipsToGive}🍺 SU ${targetPlayer.name.toUpperCase()}!`,
              subtitle: `${targetPlayer.name} può usare lo SPECCHIO 🪞 per riflettere i ${sipsToGive} sorsi a ${player.name}!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🍺 ${player.name} lancia ${sipCard.label} contro ${targetPlayer.name} (${SUIT_INFO[targetSuit].symbol})! ${targetPlayer.name} può usare lo Specchio 🪞!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        const updatedPlayers = afterPlayPlayers.map((p, idx) =>
          idx === targetPlayerIdx
            ? {
                ...p,
                sipsDrunk: p.sipsDrunk + sipsToGive,
              }
            : p
        );

        const nextState: GameState = {
          ...state,
          players: updatedPlayers,
          discardPile: [...state.discardPile, state.topCard],
          topCard: { ...sipCard, suit: targetSuit },
          activePlayerIndex: nextActive,
          timer: 7,
          lastDrinkEvent: {
            drinkerIndex: targetPlayerIdx,
            drinkerName: targetPlayer.name,
            drinkerSuit: targetPlayer.suit,
            senderIndex: controllingIndex,
            senderName: player.name,
            senderSuit: player.suit,
            sips: sipsToGive,
            reason: `Colpo Diretto (${sipCard.label}) giocato da ${player.name}`,
            cardLabel: sipCard.label,
            cardSuit: targetSuit,
          },
          lastActionBanner: {
            title: `COLPO DIRETTO: ${targetPlayer.name.toUpperCase()} BEVE ${sipsToGive}🍺 DA ${player.name.toUpperCase()}!`,
            subtitle: `${player.name} gioca ${sipCard.label} sul seme ${SUIT_INFO[targetSuit].symbol}: ${targetPlayer.name} beve ${sipsToGive} ${sipsToGive === 1 ? 'sorso' : 'sorsi'}!`,
            tone: 'drink',
          },
          logs: [
            makeLog(
              `🍺 ${player.name} gioca ${sipCard.label} sul seme ${SUIT_INFO[targetSuit].symbol} a terra: ${targetPlayer.name} beve subito ${sipsToGive} ${sipsToGive === 1 ? 'sorso' : 'sorsi'}!`,
              'drink'
            ),
            ...state.logs,
          ],
        };

        return checkGameOver(nextState);
      }

      // Primary card that lands on top (prefer player's suit if combo so topCard shows faction suit)
      const primaryCard =
        selectedCards.find((c) => c.suit === player.suit) || selectedCards[0];
      const otherSelected = selectedCards.filter((c) => c.id !== primaryCard.id);

      // --- CASE A: NEUTRAL FLOW ---
      if (state.mode === 'NEUTRAL_FLOW') {
        const playInfo = getCardPlayability(state, controllingIndex, primaryCard);

        // --- EVENT CARDS IN NEUTRAL FLOW ---
        // E1: Cambio Giro (REVERSE_SUIT)
        if (playInfo.actionType === 'EVENT_REVERSE') {
          const newDirection: Direction =
            state.lastDirection === 'forward' ? 'backward' : 'forward';
          const nextActive = getNextTurnIndex(controllingIndex, newDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            lastDirection: newDirection,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `CAMBIO GIRO (${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${player.name} inverte il giro! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🔄 ${player.name} gioca Cambio Giro (${SUIT_INFO[primaryCard.suit].symbol})! Ora il tavolo gira in senso ${newDirection === 'forward' ? 'orario' : 'antiorario'}.`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E2: Stop (STOP_SUIT in NEUTRAL_FLOW -> neutral discard / tregua, NO skip)
        if (playInfo.actionType === 'EVENT_STOP') {
          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `STOP A TERRA (TREGUA)!`,
              subtitle: `${player.name} gioca STOP (${SUIT_INFO[primaryCard.suit].symbol}). Nessun salto: tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🛑 ${player.name} posa STOP (${SUIT_INFO[primaryCard.suit].symbol}) a terra e passa il turno a ${state.players[nextActive].name}.`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E2b: Salta Turno (SKIP_TURN in NEUTRAL_FLOW -> skips next player, unless countered by Mirror)
        if (playInfo.actionType === 'EVENT_SKIP_TURN') {
          const targetIdx = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const targetPlayer = state.players[targetIdx];
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const targetHasMirror = updatedPlayers[targetIdx]?.hand.some(
            (c) => c.eventKind === 'MIRROR'
          );

          // If target has a MIRROR card, give them the chance to reflect the Skip Turn!
          if (targetHasMirror) {
            const nextState: GameState = {
              ...state,
              players: updatedPlayers,
              discardPile: [...state.discardPile, state.topCard],
              topCard: primaryCard,
              mode: 'SPECIAL_EVENT',
              activePlayerIndex: targetIdx,
              timer: 7,
              specialEvent: {
                type: 'SKIP_ATTACK',
                attackerIndex: controllingIndex,
                targetIndex: targetIdx,
                playedCard: primaryCard,
              },
              lastActionBanner: {
                title: `SALTA TURNO A ${targetPlayer.name.toUpperCase()}!`,
                subtitle: `${player.name} lancia Salta Turno a ${targetPlayer.name}! Rifletti con lo Specchio o salta il turno!`,
                tone: 'attack',
              },
              logs: [
                makeLog(
                  `⏭️ ${player.name} gioca SALTA TURNO contro ${targetPlayer.name}!`,
                  'attack'
                ),
                ...state.logs,
              ],
            };

            return checkGameOver(nextState);
          }

          // Target has NO mirror: skipped automatically!
          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 2);
          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `SALTA IL TURNO A ${targetPlayer.name.toUpperCase()}!`,
              subtitle: `${targetPlayer.name} salta il turno! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `⏭️ ${player.name} gioca SALTA TURNO: ${targetPlayer.name} salta il turno!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E3: Scambio 1 Carta col Vicino di Destra (PASS_RIGHT)
        if (playInfo.actionType === 'EVENT_PASS_RIGHT' || validation.isPassRightCombo) {
          const passRightCard =
            selectedCards.find((c) => c.eventKind === 'PASS_RIGHT') || primaryCard;
          const chosenCardToGive = selectedCards.find((c) => c.id !== passRightCard.id);

          // First remove only the played PASS_RIGHT card from hand
          const afterPlayPlayers = state.players.map((p, idx) =>
            idx === controllingIndex
              ? { ...p, hand: p.hand.filter((c) => c.id !== passRightCard.id) }
              : { ...p, hand: [...p.hand] }
          );

          // Check if anyone emptied their hand by playing PASS_RIGHT as their last card
          const immediateWinCheck = checkGameOver({
            ...state,
            players: afterPlayPlayers,
          });
          if (immediateWinCheck.mode === 'GAME_OVER') {
            return immediateWinCheck;
          }

          // Each player picks 1 card to pass to their right neighbor:
          // Right neighbor of index i is (i + 3) % 4 (i.e. counter-clockwise neighbor)
          const passedCards: (Card | null)[] = [null, null, null, null];
          const remainingHands: Card[][] = [[], [], [], []];

          for (let i = 0; i < 4; i++) {
            const h = afterPlayPlayers[i].hand;
            if (h.length > 0) {
              if (i === controllingIndex && chosenCardToGive) {
                passedCards[i] = chosenCardToGive;
                remainingHands[i] = h.filter((c) => c.id !== chosenCardToGive.id);
              } else {
                const chosenIdx = Math.floor(Math.random() * h.length);
                passedCards[i] = h[chosenIdx];
                remainingHands[i] = h.filter((_, idx) => idx !== chosenIdx);
              }
            }
          }

          const swappedPlayers = afterPlayPlayers.map((p, idx) => {
            // Player idx receives from their left neighbor (idx + 1) % 4, who passed to their right
            const senderIdx = (idx + 1) % 4;
            const incoming = passedCards[senderIdx];
            return {
              ...p,
              hand: incoming ? [...remainingHands[idx], incoming] : remainingHands[idx],
            };
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const rightNeighbor = state.players[(controllingIndex + 3) % 4];
          const chosenDesc = chosenCardToGive
            ? ` (cede ${chosenCardToGive.label}${SUIT_INFO[chosenCardToGive.suit].symbol} a ${rightNeighbor.name})`
            : '';

          return {
            ...state,
            players: swappedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: { ...passRightCard, suit: state.topCard.suit },
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `SCAMBIO A DESTRA!`,
              subtitle: `Tutti passano 1 carta a destra${chosenDesc}! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🫱 ${player.name} attiva Scambio a Destra${chosenDesc}: tutti passano 1 carta al vicino di destra!`,
                'special'
              ),
              ...state.logs,
            ],
          };
        }

        // E4: Rossi pescano 2 carte (RED_DRAW_2 -> Hearts 0 & Diamonds 1)
        if (playInfo.actionType === 'EVENT_RED_DRAW_2') {
          let curDeck = [...state.deck];
          let curDiscard = [...state.discardPile, state.topCard];

          const updatedPlayers = state.players.map((p, idx) => {
            let baseP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            if (baseP.suit === 'hearts' || baseP.suit === 'diamonds') {
              const drawRes = drawCardsFromDeck(curDeck, curDiscard, 2);
              curDeck = drawRes.newDeck;
              curDiscard = drawRes.newDiscardPile;
              baseP = { ...baseP, hand: [...baseP.hand, ...drawRes.drawn] };
            }
            return baseP;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            deck: curDeck,
            discardPile: curDiscard,
            topCard: primaryCard,
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `ROSSI PESCANO +2 CARTE (♥ ♦)!`,
              subtitle: `Cuori ♥ e Quadri ♦ pescano 2 carte a testa! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🎴 ${player.name} gioca Rossi +2: Cuori ♥ e Quadri ♦ pescano 2 carte a testa!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E5: Neri pescano 2 carte (BLACK_DRAW_2 -> Clubs 2 & Spades 3)
        if (playInfo.actionType === 'EVENT_BLACK_DRAW_2') {
          let curDeck = [...state.deck];
          let curDiscard = [...state.discardPile, state.topCard];

          const updatedPlayers = state.players.map((p, idx) => {
            let baseP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            if (baseP.suit === 'clubs' || baseP.suit === 'spades') {
              const drawRes = drawCardsFromDeck(curDeck, curDiscard, 2);
              curDeck = drawRes.newDeck;
              curDiscard = drawRes.newDiscardPile;
              baseP = { ...baseP, hand: [...baseP.hand, ...drawRes.drawn] };
            }
            return baseP;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            deck: curDeck,
            discardPile: curDiscard,
            topCard: primaryCard,
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `NERI PESCANO +2 CARTE (♣ ♠)!`,
              subtitle: `Fiori ♣ e Picche ♠ pescano 2 carte a testa! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🎴 ${player.name} gioca Neri +2: Fiori ♣ e Picche ♠ pescano 2 carte a testa!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E6: Tutti pescano 1 carta (ALL_DRAW_1)
        if (playInfo.actionType === 'EVENT_ALL_DRAW_1') {
          let curDeck = [...state.deck];
          let curDiscard = [...state.discardPile, state.topCard];

          const updatedPlayers = state.players.map((p, idx) => {
            const baseP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            const drawRes = drawCardsFromDeck(curDeck, curDiscard, 1);
            curDeck = drawRes.newDeck;
            curDiscard = drawRes.newDiscardPile;
            return { ...baseP, hand: [...baseP.hand, ...drawRes.drawn] };
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            deck: curDeck,
            discardPile: curDiscard,
            topCard: primaryCard,
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `TUTTI PESCANO +1 CARTA!`,
              subtitle: `Ogni giocatore al tavolo pesca 1 carta! Tocca a ${state.players[nextActive].name}.`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🃏 ${player.name} gioca Tutti +1: tutti i 4 giocatori pescano 1 carta!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E7: Tassa sui Ricchi (TAX_RICH -> chi ha meno carte in mano pesca +2 carte e beve 1 sorso)
        if (playInfo.actionType === 'EVENT_TAX_RICH') {
          let curDeck = [...state.deck];
          let curDiscard = [...state.discardPile, state.topCard];

          const afterPlayPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const opponentHandSizes = afterPlayPlayers
            .filter((_, idx) => idx !== controllingIndex)
            .map((p) => p.hand.length);
          const minCards = Math.min(...opponentHandSizes);

          const taxedNames: string[] = [];
          const updatedPlayers = afterPlayPlayers.map((p, idx) => {
            if (idx !== controllingIndex && p.hand.length === minCards) {
              const drawRes = drawCardsFromDeck(curDeck, curDiscard, 2);
              curDeck = drawRes.newDeck;
              curDiscard = drawRes.newDiscardPile;
              taxedNames.push(p.name);
              return {
                ...p,
                hand: [...p.hand, ...drawRes.drawn],
                sipsDrunk: p.sipsDrunk + 1,
              };
            }
            return p;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const taxedListStr = taxedNames.join(' e ');

          const nextState: GameState = {
            ...state,
            deck: curDeck,
            discardPile: curDiscard,
            topCard: { ...primaryCard, suit: state.topCard.suit },
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            lastDrinkEvent: {
              drinkerIndex: -1,
              drinkerName: taxedListStr,
              drinkerSuit: player.suit,
              senderIndex: controllingIndex,
              senderName: player.name,
              senderSuit: player.suit,
              sips: 1,
              reason: `Tassa sui Ricchi 📉 giocata da ${player.name}`,
              cardLabel: 'Tassa 📉',
              cardSuit: state.topCard.suit,
            },
            lastActionBanner: {
              title: `TASSA SUI RICCHI: ${taxedListStr.toUpperCase()} BEVE 1🍺 DA ${player.name.toUpperCase()}!`,
              subtitle: `${taxedListStr} (${minCards} carte) pesca +2 carte e beve 1🍺! Tocca a ${state.players[nextActive].name}.`,
              tone: 'drink',
            },
            logs: [
              makeLog(
                `📉 ${player.name} gioca Tassa sui Ricchi: ${taxedListStr} aveva meno carte (${minCards}) e subisce +2 carte e 1 sorso!`,
                'drink'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E8: Duello 1v1 (DUEL_HIGH / DUEL_LOW - ciascun giocatore sceglie una carta numerica 2-10 da mano, chi non la ha perde in automatico)
        if (
          playInfo.actionType === 'EVENT_DUEL_HIGH' ||
          playInfo.actionType === 'EVENT_DUEL_LOW'
        ) {
          const isHighDuel = playInfo.actionType === 'EVENT_DUEL_HIGH';
          const targetIdx =
            action.targetPlayerIndex !== undefined &&
            action.targetPlayerIndex !== controllingIndex
              ? action.targetPlayerIndex
              : getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const targetPlayer = state.players[targetIdx];

          // Mano dell'attaccante senza la carta duello appena giocata
          const initiatorHandWithoutDuel = player.hand.filter((c) => !action.cardIds.includes(c.id));

          // Attaccante sceglie carta numerica 2-10 dalla propria mano
          const cardAttacker = pickBestDuelCard(initiatorHandWithoutDuel, isHighDuel);
          const hasAttackerCard = Boolean(cardAttacker);

          // Bersaglio sceglie carta numerica 2-10 dalla propria mano
          const cardTarget = pickBestDuelCard(targetPlayer.hand, isHighDuel);
          const hasTargetCard = Boolean(cardTarget);

          const participants: ActiveDuelParticipant[] = [
            {
              player: { ...player, hand: initiatorHandWithoutDuel },
              card: cardAttacker,
              hasNoCard: !hasAttackerCard,
            },
            {
              player: targetPlayer,
              card: cardTarget,
              hasNoCard: !hasTargetCard,
            },
          ];

          const verdict = resolveDuelVerdict(isHighDuel ? 'DUEL_HIGH' : 'DUEL_LOW', participants);
          const primaryLoserIdx = verdict.primaryLoserIdx;
          const primaryLoserPlayer = state.players[primaryLoserIdx];
          const isTie = verdict.isTie;
          const loserIndices = verdict.loserIndices;

          // Rimuovi le carte giocate nel duello dalle rispettive mani
          const cardsToRemoveByPlayer: { [pId: number]: string } = {};
          if (cardAttacker) cardsToRemoveByPlayer[controllingIndex] = cardAttacker.id;
          if (cardTarget) cardsToRemoveByPlayer[targetIdx] = cardTarget.id;

          const cardsToDiscard: Card[] = [
            ...otherSelected,
            ...(cardAttacker ? [cardAttacker] : []),
            ...(cardTarget ? [cardTarget] : []),
          ];

          const updatedPlayers = state.players.map((p, idx) => {
            let nextHand = idx === controllingIndex ? initiatorHandWithoutDuel : p.hand;
            if (cardsToRemoveByPlayer[idx]) {
              nextHand = nextHand.filter((c) => c.id !== cardsToRemoveByPlayer[idx]);
            }
            let nextP: Player = {
              ...p,
              hand: nextHand,
              attacksLaunched: idx === controllingIndex ? (p.attacksLaunched || 0) + 1 : p.attacksLaunched,
            };
            if (loserIndices.includes(idx)) {
              nextP = {
                ...nextP,
                sipsDrunk: nextP.sipsDrunk + 2,
              };
            }
            return nextP;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const duelTitle = isHighDuel ? 'DUELLO CARTA ALTA ⚔️▲' : 'DUELLO CARTA BASSA ⚔️▼';

          const activeDuel: ActiveDuelState = {
            duelKind: isHighDuel ? 'DUEL_HIGH' : 'DUEL_LOW',
            initiatorIndex: controllingIndex,
            targetIndex: targetIdx,
            phase: 'REVEALED',
            participants,
            loserIndex: primaryLoserIdx,
            loserIndices,
            isTie,
            sipsToDrink: 2,
          };

          const attackerDesc = cardAttacker
            ? `${cardAttacker.label}${SUIT_INFO[cardAttacker.suit].symbol}`
            : 'Nessuna Carta';
          const targetDesc = cardTarget
            ? `${cardTarget.label}${SUIT_INFO[cardTarget.suit].symbol}`
            : 'Nessuna Carta';

          const nextState: GameState = {
            ...state,
            discardPile: [...state.discardPile, state.topCard, ...cardsToDiscard],
            topCard: { ...primaryCard, suit: state.topCard.suit },
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            activeDuel,
            lastDrinkEvent: isTie
              ? {
                  drinkerIndex: -1,
                  drinkerName: `${player.name} e ${targetPlayer.name}`,
                  drinkerSuit: player.suit,
                  senderIndex: controllingIndex,
                  senderName: 'Parità al Duello',
                  senderSuit: player.suit,
                  sips: 2,
                  reason: `Parità (${attackerDesc} = ${targetDesc}) al ${duelTitle}`,
                  cardLabel: primaryCard.label,
                  cardSuit: state.topCard.suit,
                }
              : {
                  drinkerIndex: primaryLoserIdx,
                  drinkerName: primaryLoserPlayer.name,
                  drinkerSuit: primaryLoserPlayer.suit,
                  senderIndex: primaryLoserIdx === controllingIndex ? targetPlayer.id : player.id,
                  senderName: primaryLoserIdx === controllingIndex ? targetPlayer.name : player.name,
                  senderSuit: primaryLoserIdx === controllingIndex ? targetPlayer.suit : player.suit,
                  sips: 2,
                  reason: `${duelTitle} perso contro ${primaryLoserIdx === controllingIndex ? targetPlayer.name : player.name}`,
                  cardLabel: primaryCard.label,
                  cardSuit: state.topCard.suit,
                },
            lastActionBanner: isTie
              ? {
                  title: `${duelTitle}: PARITÀ (${attackerDesc}=${targetDesc})! BEVONO ENTRAMBI 2🍺!`,
                  subtitle: `${player.name} [${attackerDesc}] vs ${targetPlayer.name} [${targetDesc}] → Parità! 2 sorsi a testa!`,
                  tone: 'drink',
                }
              : {
                  title: `${duelTitle}: ${primaryLoserPlayer.name.toUpperCase()} BEVE 2🍺!`,
                  subtitle: `${player.name} [${attackerDesc}] vs ${targetPlayer.name} [${targetDesc}] → ${primaryLoserPlayer.name} perde e beve 2 sorsi!`,
                  tone: 'drink',
                },
            logs: [
              isTie
                ? makeLog(
                    `⚔️ ${duelTitle}! PARITÀ tra ${player.name} (${attackerDesc}) e ${targetPlayer.name} (${targetDesc}): entrambi bevono 2 sorsi!`,
                    'drink'
                  )
                : makeLog(
                    `⚔️ ${duelTitle}! ${player.name} gioca ${attackerDesc}, ${targetPlayer.name} gioca ${targetDesc}: ${primaryLoserPlayer.name} perde e beve 2 sorsi!`,
                    'drink'
                  ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E9: Super Duello con Tutti (SUPER_DUEL_HIGH / SUPER_DUEL_LOW - ciascun giocatore sceglie da mano, chi non la ha perde in automatico)
        if (
          playInfo.actionType === 'EVENT_SUPER_DUEL_HIGH' ||
          playInfo.actionType === 'EVENT_SUPER_DUEL_LOW'
        ) {
          const isHighSuper = playInfo.actionType === 'EVENT_SUPER_DUEL_HIGH';
          const initiatorHandWithoutDuel = player.hand.filter((c) => !action.cardIds.includes(c.id));

          const participants: ActiveDuelParticipant[] = state.players.map((p, idx) => {
            const h = idx === controllingIndex ? initiatorHandWithoutDuel : p.hand;
            const chosen = pickBestDuelCard(h, isHighSuper);
            return {
              player: idx === controllingIndex ? { ...p, hand: initiatorHandWithoutDuel } : p,
              card: chosen,
              hasNoCard: !chosen,
            };
          });

          const verdict = resolveDuelVerdict(isHighSuper ? 'SUPER_DUEL_HIGH' : 'SUPER_DUEL_LOW', participants);
          const loserIndices = verdict.loserIndices;
          const primaryLoserIdx = verdict.primaryLoserIdx;
          const primaryLoserPlayer = state.players[primaryLoserIdx];
          const isTie = verdict.isTie;
          const tiedNames = loserIndices.map((i) => state.players[i].name).join(' e ');

          const cardsToDiscard: Card[] = [...otherSelected];
          participants.forEach((pt) => {
            if (pt.card) cardsToDiscard.push(pt.card);
          });

          const updatedPlayers = state.players.map((p, idx) => {
            let nextHand = idx === controllingIndex ? initiatorHandWithoutDuel : p.hand;
            const pt = participants[idx];
            if (pt?.card) {
              nextHand = nextHand.filter((c) => c.id !== pt.card!.id);
            }
            let nextP: Player = {
              ...p,
              hand: nextHand,
              attacksLaunched: idx === controllingIndex ? (p.attacksLaunched || 0) + 1 : p.attacksLaunched,
            };
            if (loserIndices.includes(idx)) {
              nextP = {
                ...nextP,
                sipsDrunk: nextP.sipsDrunk + 2,
              };
            }
            return nextP;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const superTitle = isHighSuper
            ? 'SUPER DUELLO ALTO 💥▲'
            : 'SUPER DUELLO BASSO 💥▼';

          const activeDuel: ActiveDuelState = {
            duelKind: isHighSuper ? 'SUPER_DUEL_HIGH' : 'SUPER_DUEL_LOW',
            initiatorIndex: controllingIndex,
            phase: 'REVEALED',
            participants,
            loserIndex: primaryLoserIdx,
            loserIndices,
            isTie,
            sipsToDrink: 2,
          };

          const summaryCards = participants
            .map((pt) => {
              const name = pt.player.name.replace('Bot ', '').replace(' 🤖', '');
              const cDesc = pt.card ? `${pt.card.label}${SUIT_INFO[pt.card.suit].symbol}` : 'No Carta';
              return `${name}:${cDesc}`;
            })
            .join(' · ');

          const nextState: GameState = {
            ...state,
            discardPile: [...state.discardPile, state.topCard, ...cardsToDiscard],
            topCard: { ...primaryCard, suit: state.topCard.suit },
            players: updatedPlayers,
            activePlayerIndex: nextActive,
            timer: 7,
            activeDuel,
            lastDrinkEvent: isTie
              ? {
                  drinkerIndex: -1,
                  drinkerName: tiedNames,
                  drinkerSuit: primaryLoserPlayer.suit,
                  senderIndex: controllingIndex,
                  senderName: player.name,
                  senderSuit: player.suit,
                  sips: 2,
                  reason: `Parità a ${superTitle}`,
                  cardLabel: primaryCard.label,
                  cardSuit: state.topCard.suit,
                }
              : {
                  drinkerIndex: primaryLoserIdx,
                  drinkerName: primaryLoserPlayer.name,
                  drinkerSuit: primaryLoserPlayer.suit,
                  senderIndex: controllingIndex,
                  senderName: player.name,
                  senderSuit: player.suit,
                  sips: 2,
                  reason: `${superTitle} perso`,
                  cardLabel: primaryCard.label,
                  cardSuit: state.topCard.suit,
                },
            lastActionBanner: isTie
              ? {
                  title: `${superTitle}: PARITÀ (${tiedNames.toUpperCase()})!`,
                  subtitle: `${summaryCards} → ${tiedNames} bevono 2 sorsi a testa!`,
                  tone: 'drink',
                }
              : {
                  title: `${superTitle}: ${primaryLoserPlayer.name.toUpperCase()} BEVE 2🍺!`,
                  subtitle: `${summaryCards} → ${primaryLoserPlayer.name} perde e beve 2 sorsi!`,
                  tone: 'drink',
                },
            logs: [
              makeLog(
                `💥 ${superTitle}! ${summaryCards} → ${isTie ? `${tiedNames} pareggiano e bevono` : `${primaryLoserPlayer.name} perde e beve`} 2 sorsi!`,
                'drink'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // E10: Riflessi da Tavolo (TABLE_REFLEX -> Mini-gioco lampo 2 sec, chi tocca per ultimo beve 1 sorso e pesca 1 carta)
        if (playInfo.actionType === 'EVENT_TABLE_REFLEX') {
          const initiatorHandWithoutCard = player.hand.filter((c) => !action.cardIds.includes(c.id));

          const participants: ReflexParticipant[] = state.players.map((p) => ({
            playerIndex: p.id,
            playerName: p.name,
            isAI: Boolean(p.isAI),
            tapped: false,
          }));

          const activeReflex: ActiveReflexState = {
            initiatorIndex: controllingIndex,
            playedCard: primaryCard,
            createdAt: Date.now(),
            durationMs: 2000,
            participants,
            phase: 'ACTIVE',
            targetCoords: {
              top: 35 + Math.floor(Math.random() * 30),
              left: 25 + Math.floor(Math.random() * 50),
            },
          };

          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? { ...p, hand: initiatorHandWithoutCard } : p
          );

          const nextState: GameState = {
            ...state,
            discardPile: [...state.discardPile, state.topCard],
            topCard: { ...primaryCard, suit: state.topCard.suit },
            players: updatedPlayers,
            activeReflex,
            timer: 7,
            lastActionBanner: {
              title: `⚡ RIFLESSI DA TAVOLO! ⚡`,
              subtitle: `${player.name} ha scatenato la sfida di riflessi! TOCCA IL BERSAGLIO ENTRO 2 SECONDI!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `⚡🎯 ${player.name} gioca Riflessi da Tavolo! Tutti i giocatori devono toccare il bersaglio entro 2 secondi!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // A1: Faction Attack (single, coppia, or tris)
        if (playInfo.actionType === 'FACTION_ATTACK' || validation.isCombo) {
          const sips = calculateBaseAttackSips(primaryCard.value, selectedCards.length);
          const nextDefender = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const comboName =
            selectedCards.length === 4
              ? 'POKER D\'ASSALTO'
              : selectedCards.length === 3
              ? 'TRIS D\'ASSALTO'
              : selectedCards.length === 2
              ? 'COPPIA D\'ATTACCO'
              : 'ATTACCO DI FAZIONE';

          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex
              ? {
                  ...removePlayedFromHand(p),
                  attacksLaunched: (p.attacksLaunched || 0) + 1,
                }
              : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard, ...otherSelected],
            topCard: primaryCard,
            mode: 'ATTACK_CHAIN',
            activePlayerIndex: controllingIndex,
            defenderIndex: nextDefender,
            currentSips: sips,
            timer: 7,
            lastActionBanner: {
              title: `${comboName}! (${sips} ${sips === 1 ? 'Sorso' : 'Sorsi'})`,
              subtitle: `${player.name} attacca ${state.players[nextDefender].name} con ${selectedCards.map((c) => `${c.label}${SUIT_INFO[c.suit].symbol}`).join(' + ')}!`,
              tone: 'attack',
            },
            logs: [
              makeLog(
                `⚔️ ${player.name} lancia ${comboName} (${selectedCards.map((c) => `${c.label}${SUIT_INFO[c.suit].symbol}`).join(', ')}) su ${state.players[nextDefender].name} per ${sips} sorsi!`,
                'attack'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // A2: Link Discard (Scarto di Collegamento)
        if (playInfo.actionType === 'LINK_DISCARD') {
          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            activePlayerIndex: nextActive,
            timer: 7,
            lastActionBanner: {
              title: `Scarto: ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}`,
              subtitle: `${player.name} cambia carta. Tocca a ${state.players[nextActive].name}.`,
              tone: 'neutral',
            },
            logs: [
              makeLog(
                `🔗 ${player.name} scarta ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}. Turno a ${state.players[nextActive].name}.`,
                'info'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // A3: Power Cards (J, Q, K, A)
        if (playInfo.actionType === 'POWER_JACK') {
          const targetIdx =
            action.targetPlayerIndex !== undefined &&
            action.targetPlayerIndex !== controllingIndex
              ? action.targetPlayerIndex
              : getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const targetHasCounterJack = updatedPlayers[targetIdx].hand.some(
            (c) => !c.eventKind && c.value === 11
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'SPECIAL_EVENT',
            timer: 7,
            specialEvent: {
              type: 'JACK_SPY',
              attackerIndex: controllingIndex,
              targetIndex: targetIdx,
              phase: targetHasCounterJack ? 'AWAITING_COUNTER' : 'SPYING_ATTACK',
              playedCard: primaryCard,
            },
            lastActionBanner: {
              title: targetHasCounterJack
                ? `FANTE DI SPIONAGGIO (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`
                : `MANO DI ${state.players[targetIdx].name.toUpperCase()} SVELATA!`,
              subtitle: targetHasCounterJack
                ? `${player.name} vuole spiare le carte di ${state.players[targetIdx].name}!`
                : `${state.players[targetIdx].name} non ha Fanti! ${player.name} vede le sue carte e può attaccare!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                targetHasCounterJack
                  ? `🕵️ ${player.name} gioca Fante (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}) per spiare ${state.players[targetIdx].name}!`
                  : `🕵️ ${player.name} gioca Fante (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}): ${state.players[targetIdx].name} non ha Contro-Fante, carte svelate subito!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        if (playInfo.actionType === 'POWER_QUEEN') {
          const targetIdx =
            action.targetPlayerIndex !== undefined &&
            action.targetPlayerIndex !== controllingIndex
              ? action.targetPlayerIndex
              : getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const targetHasCounterQueenOrSix = updatedPlayers[targetIdx].hand.some(
            (c) =>
              !c.eventKind &&
              (c.value === 12 || (c.value === 6 && c.suit === primaryCard.suit))
          );

          // Auto-resolve immediately if target has no Queen and no 6 of the same suit!
          if (!targetHasCounterQueenOrSix) {
            const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
              state.deck,
              [...state.discardPile, state.topCard],
              2
            );
            const autoPlayers = updatedPlayers.map((p, idx) =>
              idx === targetIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
            );
            const nextActive = getNextTurnIndex(targetIdx, state.lastDirection, 1);

            const autoState: GameState = {
              ...state,
              deck: newDeck,
              discardPile: newDiscardPile,
              topCard: primaryCard,
              players: autoPlayers,
              mode: 'NEUTRAL_FLOW',
              activePlayerIndex: nextActive,
              defenderIndex: null,
              specialEvent: null,
              timer: 7,
              lastActionBanner: {
                title: `REGINA: +2 CARTE A ${state.players[targetIdx].name.toUpperCase()}!`,
                subtitle: `${state.players[targetIdx].name} non ha difese e pesca subito +2 carte! Tocca a ${state.players[nextActive].name}.`,
                tone: 'special',
              },
              logs: [
                makeLog(
                  `👑 ${player.name} scaglia la Regina (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}): ${state.players[targetIdx].name} non ha Q o 6${SUIT_INFO[primaryCard.suit].symbol} e pesca subito 2 carte!`,
                  'special'
                ),
                ...state.logs,
              ],
            };

            return checkGameOver(autoState);
          }

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'SPECIAL_EVENT',
            timer: 7,
            specialEvent: {
              type: 'QUEEN_BURDEN',
              attackerIndex: controllingIndex,
              targetIndex: targetIdx,
              phase: 'AWAITING_RESPONSE',
              playedCard: primaryCard,
            },
            lastActionBanner: {
              title: `REGINA (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${state.players[targetIdx].name} deve rispondere con Q o 6${SUIT_INFO[primaryCard.suit].symbol}, o pescare +2 carte!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `👑 ${player.name} scaglia la Regina (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}) su ${state.players[targetIdx].name}: +2 carte!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        if (playInfo.actionType === 'POWER_KING') {
          const responderIdx = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const responderHasCounterKing = updatedPlayers[responderIdx].hand.some(
            (c) => !c.eventKind && c.value === 13
          );

          const isResponderAI = Boolean(updatedPlayers[responderIdx].isAI);

          // Auto-resolve immediately ONLY if responder is AI and has no King!
          // If the responder is a human player, ALWAYS enter SPECIAL_EVENT so they can click "HO BEVUTO! 🍻" or play a King!
          if (isResponderAI && !responderHasCounterKing) {
            const autoPlayers = updatedPlayers.map((p, idx) =>
              idx !== controllingIndex ? { ...p, sipsDrunk: p.sipsDrunk + 1 } : p
            );
            const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

            const autoState: GameState = {
              ...state,
              players: autoPlayers,
              discardPile: [...state.discardPile, state.topCard],
              topCard: primaryCard,
              mode: 'NEUTRAL_FLOW',
              activePlayerIndex: nextActive,
              defenderIndex: null,
              specialEvent: null,
              timer: 7,
              lastDrinkEvent: {
                drinkerIndex: -1,
                drinkerName: 'Tutti gli avversari',
                drinkerSuit: player.suit,
                senderIndex: controllingIndex,
                senderName: player.name,
                senderSuit: player.suit,
                sips: 1,
                reason: `Brindisi del Re 👑 offerto da ${player.name}`,
                cardLabel: 'K 👑',
                cardSuit: primaryCard.suit,
              },
              lastActionBanner: {
                title: `BRINDISI REALE: TUTTI BEVONO 1🍺 DA ${player.name.toUpperCase()}!`,
                subtitle: `Nessun Regicidio: tutti gli avversari di ${player.name} bevono 1 sorso! Tocca a ${state.players[nextActive].name}.`,
                tone: 'drink',
              },
              logs: [
                makeLog(
                  `🍻 ${player.name} cala il Re (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}): nessun Contro-Re, tutti gli avversari bevono subito 1 sorso!`,
                  'drink'
                ),
                ...state.logs,
              ],
            };

            return checkGameOver(autoState);
          }

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'SPECIAL_EVENT',
            timer: 7,
            specialEvent: {
              type: 'KING_TOAST',
              attackerIndex: controllingIndex,
              responderIndex: responderIdx,
              playedCard: primaryCard,
            },
            lastActionBanner: {
              title: `BRINDISI REALE (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `Tutti gli avversari bevono 1 sorso, a meno che ${state.players[responderIdx].name} non cali un altro RE!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🍻 ${player.name} proclama il Brindisi Reale (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        if (playInfo.actionType === 'POWER_ACE') {
          const firstResponder = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'SPECIAL_EVENT',
            timer: 5,
            specialEvent: {
              type: 'ACE_CASCADE',
              initiatorIndex: controllingIndex,
              currentResponderIndex: firstResponder,
              cascadeSuit: primaryCard.suit,
              cardsPlayedInCascade: 1,
              playedCard: primaryCard,
            },
            lastActionBanner: {
              title: `CASCATA D'ASSO (${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `Scarta ${SUIT_INFO[primaryCard.suit].name}! Tocca a ${state.players[firstResponder].name}!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🌊 ${player.name} avvia la CASCATA di ${SUIT_INFO[primaryCard.suit].name} (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }
      }

      // --- CASE B: ATTACK CHAIN (Defense) ---
      if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex === controllingIndex) {
        const playInfo = getCardPlayability(state, controllingIndex, primaryCard);
        const updatedPlayers = state.players.map((p, idx) =>
          idx === controllingIndex
            ? {
                ...removePlayedFromHand(p),
                defensesSucceeded: (p.defensesSucceeded || 0) + 1,
              }
            : p
        );

        // B0: Stop Card in Defense -> Cancels attack completely
        if (playInfo.actionType === 'DEFENSE_STOP') {
          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            currentSips: 0,
            timer: 7,
            lastActionBanner: {
              title: `STOP DIFENSIVO (${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${player.name} ferma la catena di attacco (0 sorsi)! Tocca a ${state.players[nextActive].name}.`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `🚫 ${player.name} usa STOP (${SUIT_INFO[primaryCard.suit].symbol}) e annulla l'attacco!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // B0b: Specchio Card in Defense -> Reflects attack back to attacker with x2 sips!
        if (playInfo.actionType === 'DEFENSE_MIRROR') {
          const newSips = state.currentSips * 2;
          const newDefender = state.activePlayerIndex;

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: {
              ...primaryCard,
              suit: state.topCard.suit,
              value: state.topCard.value,
              label: state.topCard.label,
            },
            activePlayerIndex: controllingIndex,
            defenderIndex: newDefender,
            currentSips: newSips,
            timer: 7,
            lastDirection: 'backward',
            lastActionBanner: {
              title: `SPECCHIO RIFLETTENTE x2 (${newSips}🍺)!`,
              subtitle: `${player.name} usa 🪞 e rispedisce ${newSips} sorsi a ${state.players[newDefender].name}!`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `🪞 SPECCHIO! ${player.name} riflette l'attacco raddoppiato (${newSips} sorsi) contro ${state.players[newDefender].name}!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // B1: Contrattacco (Valore -1) -> Sends sips BACK to attacker
        if (playInfo.actionType === 'DEFENSE_COUNTER') {
          const sameSuit = primaryCard.suit === state.topCard.suit;
          const newSips = sameSuit ? state.currentSips * 2 : state.currentSips;
          const newDefender = state.activePlayerIndex;

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            activePlayerIndex: controllingIndex,
            defenderIndex: newDefender,
            currentSips: newSips,
            timer: 7,
            lastDirection: 'backward',
            lastActionBanner: {
              title: sameSuit
                ? `CONTRATTACCO x2 (${newSips} Sorsi)!`
                : `CONTRATTACCO (-1)!`,
              subtitle: `${player.name} rimanda ${newSips} sorsi indietro a ${state.players[newDefender].name}!`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `↩️ ${player.name} contrattacca con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}${sameSuit ? ' (Stesso Seme x2!)' : ''}! ${newSips} sorsi rimandati a ${state.players[newDefender].name}.`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // B2: Deviazione (Valore +1) -> Passes sips FORWARD clockwise
        if (playInfo.actionType === 'DEFENSE_DEVIATE') {
          const sameSuit = primaryCard.suit === state.topCard.suit;
          const newSips = sameSuit ? state.currentSips * 2 : state.currentSips;
          const newDefender = (controllingIndex + 1) % 4;

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            activePlayerIndex: controllingIndex,
            defenderIndex: newDefender,
            currentSips: newSips,
            timer: 7,
            lastDirection: 'forward',
            lastActionBanner: {
              title: sameSuit
                ? `SUPER DEVIAZIONE x2 (${newSips} Sorsi)!`
                : `DEVIAZIONE (+1)!`,
              subtitle: `${player.name} devia ${newSips} sorsi in avanti verso ${state.players[newDefender].name}!`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `↪️ ${player.name} devia con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}${sameSuit ? ' (Stesso Seme x2!)' : ''} verso ${state.players[newDefender].name} (${newSips} sorsi)!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // B3: Contro-Shock (Stesso Numero) -> Both drink 1 sip, no draw, NEUTRAL_FLOW next player after defender
        if (playInfo.actionType === 'DEFENSE_SHOCK') {
          const attackerIdx = state.activePlayerIndex;
          const nextActive = (controllingIndex + 1) % 4;

          const shockPlayers = updatedPlayers.map((p, idx) =>
            idx === attackerIdx || idx === controllingIndex
              ? { ...p, sipsDrunk: p.sipsDrunk + 1 }
              : p
          );

          const nextState: GameState = {
            ...state,
            players: shockPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            currentSips: 0,
            timer: 7,
            lastDirection: 'forward',
            lastDrinkEvent: {
              drinkerIndex: -1,
              drinkerName: `${state.players[attackerIdx].name} e ${player.name}`,
              drinkerSuit: player.suit,
              senderIndex: controllingIndex,
              senderName: player.name,
              senderSuit: player.suit,
              sips: 1,
              reason: `Contro-Shock (=) con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}`,
              cardLabel: primaryCard.label,
              cardSuit: primaryCard.suit,
            },
            lastActionBanner: {
              title: `CONTRO-SHOCK (${primaryCard.label} su ${state.topCard.label})!`,
              subtitle: `Stallo! ${state.players[attackerIdx].name} e ${player.name} bevono 1 sorso a testa. Turno a ${state.players[nextActive].name}.`,
              tone: 'drink',
            },
            logs: [
              makeLog(
                `⚡ CONTRO-SHOCK! ${player.name} pareggia con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}. ${state.players[attackerIdx].name} e ${player.name} bevono 1 sorso a testa!`,
                'drink'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // B4: Muro di Scudo (Stesso Seme) -> Cancels attack completely, 0 sips, NEUTRAL_FLOW next player after defender
        if (playInfo.actionType === 'DEFENSE_SHIELD') {
          const nextActive = (controllingIndex + 1) % 4;

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            currentSips: 0,
            timer: 7,
            lastDirection: 'forward',
            lastActionBanner: {
              title: `MURO DI SCUDO (${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${player.name} annulla completamente l'attacco! Nessun sorso bevuto. Turno a ${state.players[nextActive].name}.`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `🛡️ MURO DI SCUDO! ${player.name} blocca il seme con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}. Attacco annullato!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }
      }

      // --- CASE C: SPECIAL EVENT ---
      if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
        const ev = state.specialEvent;
        const playInfo = getCardPlayability(state, controllingIndex, primaryCard);

        // C0: Specchio contro Sorsi Diretti (DIRECT_SIPS_ATTACK)
        if (
          ev.type === 'DIRECT_SIPS_ATTACK' &&
          playInfo.actionType === 'SPECIAL_COUNTER_MIRROR'
        ) {
          const origAttackerIdx = ev.attackerIndex;
          const origAttacker = state.players[origAttackerIdx];
          const sipsReflected = ev.sipsAmount;
          const nextActive = getNextTurnIndex(origAttackerIdx, state.lastDirection, 1);

          const updatedPlayers = state.players.map((p, idx) => {
            let nextP =
              idx === controllingIndex
                ? {
                    ...removePlayedFromHand(p),
                    defensesSucceeded: (p.defensesSucceeded || 0) + 1,
                  }
                : p;
            if (idx === origAttackerIdx) {
              nextP = {
                ...nextP,
                sipsDrunk: nextP.sipsDrunk + sipsReflected,
              };
            }
            return nextP;
          });

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: { ...primaryCard, suit: origAttacker.suit },
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            specialEvent: null,
            timer: 7,
            lastDrinkEvent: {
              drinkerIndex: origAttackerIdx,
              drinkerName: origAttacker.name,
              drinkerSuit: origAttacker.suit,
              senderIndex: controllingIndex,
              senderName: player.name,
              senderSuit: player.suit,
              sips: sipsReflected,
              reason: `Specchio Riflesso 🪞 giocato da ${player.name}`,
              cardLabel: '🪞',
              cardSuit: origAttacker.suit,
            },
            lastActionBanner: {
              title: `SPECCHIO! ${origAttacker.name.toUpperCase()} BEVE ${sipsReflected}🍺 DA ${player.name.toUpperCase()}!`,
              subtitle: `${player.name} usa lo Specchio 🪞 e rimanda i ${sipsReflected} sorsi diretti a ${origAttacker.name}!`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `🪞 SPECCHIO SU SORSI DIRETTI! ${player.name} riflette i ${sipsReflected}🍺 indietro a ${origAttacker.name}!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C0b: Specchio contro Salta Turno (SKIP_ATTACK) - Rimanda il salto all'aggressore!
        if (
          ev.type === 'SKIP_ATTACK' &&
          playInfo.actionType === 'SPECIAL_COUNTER_MIRROR'
        ) {
          const origAttackerIdx = ev.attackerIndex;
          const origAttacker = state.players[origAttackerIdx];
          const targetPlayer = state.players[ev.targetIndex];
          // Mirror reflects the skip turn back to the original attacker!
          // So origAttacker is skipped!
          // Target player (controllingIndex) now gets to play their normal turn!
          const nextActive = controllingIndex;

          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex
              ? {
                  ...removePlayedFromHand(p),
                  defensesSucceeded: (p.defensesSucceeded || 0) + 1,
                }
              : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            specialEvent: null,
            timer: 7,
            lastActionBanner: {
              title: `SPECCHIO 🪞 RIFLETTE IL SALTA TURNO!`,
              subtitle: `${targetPlayer.name} usa lo Specchio! ${origAttacker.name} salta il turno, tocca a ${targetPlayer.name}!`,
              tone: 'defense',
            },
            logs: [
              makeLog(
                `🪞 ${targetPlayer.name} usa lo SPECCHIO! Il Salta Turno rimbalza su ${origAttacker.name} che viene saltato!`,
                'defense'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C1: Contro-Fante (J su J)
        if (ev.type === 'JACK_SPY' && playInfo.actionType === 'SPECIAL_COUNTER_JACK') {
          const origAttacker = ev.attackerIndex;
          const origTarget = ev.targetIndex;

          const updatedPlayers = state.players.map((p, idx) => {
            const baseP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            if (idx === origAttacker || idx === origTarget) {
              return { ...baseP, sipsDrunk: baseP.sipsDrunk + 1 };
            }
            return baseP;
          });

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            timer: 7,
            activePlayerIndex: origTarget,
            specialEvent: {
              type: 'JACK_SPY',
              attackerIndex: origTarget,
              targetIndex: origAttacker,
              phase: 'SPYING_ATTACK',
              playedCard: primaryCard,
            },
            lastActionBanner: {
              title: `CONTRO-FANTE! Spionaggio Ribaltato!`,
              subtitle: `Entrambi bevono 1 sorso! Ora ${state.players[origTarget].name} vede la mano di ${state.players[origAttacker].name}!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🕵️‍♂️ CONTRO-FANTE! ${player.name} ribalta lo spionaggio su ${state.players[origAttacker].name}! Entrambi bevono 1 sorso.`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C2: Spying Direct Attack (after J resolved)
        if (
          ev.type === 'JACK_SPY' &&
          ev.phase === 'SPYING_ATTACK' &&
          (playInfo.actionType === 'SPY_DIRECT_ATTACK' || validation.isCombo)
        ) {
          const sips = calculateBaseAttackSips(primaryCard.value, selectedCards.length);
          const targetIdx = ev.targetIndex;
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex
              ? {
                  ...removePlayedFromHand(p),
                  attacksLaunched: (p.attacksLaunched || 0) + 1,
                }
              : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard, ...otherSelected],
            topCard: primaryCard,
            mode: 'ATTACK_CHAIN',
            activePlayerIndex: controllingIndex,
            defenderIndex: targetIdx,
            currentSips: sips,
            timer: 7,
            specialEvent: null,
            lastActionBanner: {
              title: `ATTACCO SPIONAGGIO (${sips} Sorsi)!`,
              subtitle: `${player.name} colpisce ${state.players[targetIdx].name} con ${selectedCards.map((c) => `${c.label}${SUIT_INFO[c.suit].symbol}`).join(' + ')}!`,
              tone: 'attack',
            },
            logs: [
              makeLog(
                `🎯 Colpo Sicuro post-Fante! ${player.name} attacca ${state.players[targetIdx].name} con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol} (${sips} sorsi)!`,
                'attack'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C3: Contro-Regina (Q su Q)
        if (ev.type === 'QUEEN_BURDEN' && playInfo.actionType === 'SPECIAL_COUNTER_QUEEN') {
          const origAttacker = ev.attackerIndex;
          const origTarget = ev.targetIndex;
          const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
            state.deck,
            [...state.discardPile, state.topCard],
            2
          );

          const updatedPlayers = state.players.map((p, idx) => {
            let nextP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            if (idx === origAttacker) {
              nextP = {
                ...nextP,
                hand: [...nextP.hand, ...drawn],
                sipsDrunk: nextP.sipsDrunk + 1,
              };
            } else if (idx === origTarget) {
              nextP = {
                ...nextP,
                sipsDrunk: nextP.sipsDrunk + 1,
              };
            }
            return nextP;
          });

          const nextActive = getNextTurnIndex(origTarget, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            deck: newDeck,
            discardPile: newDiscardPile,
            topCard: primaryCard,
            players: updatedPlayers,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            specialEvent: null,
            timer: 7,
            lastActionBanner: {
              title: `CONTRO-REGINA (Q su Q)!`,
              subtitle: `Le 2 carte tornano a ${state.players[origAttacker].name} e bevono 1 sorso a testa!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `👑 CONTRO-REGINA! ${player.name} risponde con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}: ${state.players[origAttacker].name} pesca 2 carte ed entrambi bevono 1 sorso!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C4: Beffa del 6 (6 dello stesso seme della Q)
        if (ev.type === 'QUEEN_BURDEN' && playInfo.actionType === 'SPECIAL_BEFFA_6') {
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            specialEvent: {
              ...ev,
              phase: 'SELECTING_REDIRECT_TARGET',
            },
            lastActionBanner: {
              title: `BEFFA DEL 6 (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${player.name} devia il Fardello! Scegli chi dovrà pescare le 2 carte!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🃏 BEFFA DEL 6! ${player.name} gioca ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol} e sceglie a chi scaricare le 2 carte!`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C5: Regicidio (K su K)
        if (ev.type === 'KING_TOAST' && playInfo.actionType === 'SPECIAL_COUNTER_KING') {
          const origAttacker = ev.attackerIndex;
          const updatedPlayers = state.players.map((p, idx) => {
            let nextP = idx === controllingIndex ? removePlayedFromHand(p) : p;
            if (idx === origAttacker) {
              nextP = { ...nextP, sipsDrunk: nextP.sipsDrunk + 5 };
            }
            return nextP;
          });

          const nextActive = getNextTurnIndex(controllingIndex, state.lastDirection, 1);

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            defenderIndex: null,
            specialEvent: null,
            timer: 7,
            lastDrinkEvent: {
              drinkerIndex: origAttacker,
              drinkerName: state.players[origAttacker].name,
              drinkerSuit: state.players[origAttacker].suit,
              senderIndex: controllingIndex,
              senderName: player.name,
              senderSuit: player.suit,
              sips: 5,
              reason: `Regicidio (K su K 👑) calato da ${player.name}`,
              cardLabel: primaryCard.label,
              cardSuit: primaryCard.suit,
            },
            lastActionBanner: {
              title: `REGICIDIO! ${state.players[origAttacker].name.toUpperCase()} BEVE 5🍺 DA ${player.name.toUpperCase()}!`,
              subtitle: `${player.name} annulla il Brindisi! ${state.players[origAttacker].name} beve 5 sorsi!`,
              tone: 'drink',
            },
            logs: [
              makeLog(
                `🗡️ REGICIDIO! ${player.name} cala ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}: brindisi annullato e ${state.players[origAttacker].name} beve 5 sorsi!`,
                'drink'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }

        // C6: Cascata d'Asso (same suit discard within 5s)
        if (ev.type === 'ACE_CASCADE' && playInfo.actionType === 'SPECIAL_CASCADE_SUIT') {
          const nextResponder = getNextTurnIndex(controllingIndex, state.lastDirection, 1);
          const updatedPlayers = state.players.map((p, idx) =>
            idx === controllingIndex ? removePlayedFromHand(p) : p
          );

          const nextState: GameState = {
            ...state,
            players: updatedPlayers,
            discardPile: [...state.discardPile, state.topCard],
            topCard: primaryCard,
            timer: 5,
            specialEvent: {
              ...ev,
              currentResponderIndex: nextResponder,
              cardsPlayedInCascade: ev.cardsPlayedInCascade + 1,
            },
            lastActionBanner: {
              title: `CASCATA CONTINUA (${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol})!`,
              subtitle: `${player.name} risponde! Ora tocca a ${state.players[nextResponder].name}!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `🌊 ${player.name} mantiene la Cascata con ${primaryCard.label}${SUIT_INFO[primaryCard.suit].symbol}! Tocca a ${state.players[nextResponder].name}.`,
                'special'
              ),
              ...state.logs,
            ],
          };

          return checkGameOver(nextState);
        }
      }

      return state;
    }

    case 'SELECT_QUEEN_REDIRECT': {
      if (
        state.mode !== 'SPECIAL_EVENT' ||
        state.specialEvent?.type !== 'QUEEN_BURDEN' ||
        state.specialEvent.phase !== 'SELECTING_REDIRECT_TARGET'
      ) {
        return state;
      }

      const victimIdx = action.targetPlayerIndex;
      const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
        state.deck,
        state.discardPile,
        2
      );

      const updatedPlayers = state.players.map((p, idx) =>
        idx === victimIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
      );

      const nextActive = getNextTurnIndex(state.specialEvent.targetIndex, state.lastDirection, 1);

      return {
        ...state,
        deck: newDeck,
        discardPile: newDiscardPile,
        players: updatedPlayers,
        mode: 'NEUTRAL_FLOW',
        activePlayerIndex: nextActive,
        defenderIndex: null,
        specialEvent: null,
        timer: 7,
        lastActionBanner: {
          title: `Fardello Scaricato su ${state.players[victimIdx].name}!`,
          subtitle: `${state.players[victimIdx].name} pesca +2 carte! Turno a ${state.players[nextActive].name}.`,
          tone: 'special',
        },
        logs: [
          makeLog(
            `🃏 Beffa del 6 completata: ${state.players[victimIdx].name} pesca 2 carte!`,
            'special'
          ),
          ...state.logs,
        ],
      };
    }

    case 'TAKE_SIPS': {
      // In ATTACK_CHAIN: Incasso (Defender drinks currentSips and draws 1 penalty card)
      if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex !== null) {
        const defIdx = state.defenderIndex;
        const defender = state.players[defIdx];
        const sipsToDrink = state.currentSips;
        const attacker = state.players[state.activePlayerIndex];

        const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
          state.deck,
          state.discardPile,
          1
        );

        const updatedPlayers = state.players.map((p, idx) =>
          idx === defIdx
            ? {
                ...p,
                sipsDrunk: p.sipsDrunk + sipsToDrink,
                hand: [...p.hand, ...drawn],
              }
            : p
        );

        const nextActive = (defIdx + 1) % 4;

        return {
          ...state,
          deck: newDeck,
          discardPile: newDiscardPile,
          players: updatedPlayers,
          mode: 'NEUTRAL_FLOW',
          activePlayerIndex: nextActive,
          defenderIndex: null,
          currentSips: 0,
          timer: 7,
          lastDirection: 'forward',
          lastDrinkEvent: {
            drinkerIndex: defIdx,
            drinkerName: defender.name,
            drinkerSuit: defender.suit,
            senderIndex: state.activePlayerIndex,
            senderName: attacker.name,
            senderSuit: attacker.suit,
            sips: sipsToDrink,
            reason: `Attacco subito (${state.topCard.label}${SUIT_INFO[state.topCard.suit].symbol}) da ${attacker.name}`,
            cardLabel: state.topCard.label,
            cardSuit: state.topCard.suit,
          },
          lastActionBanner: {
            title: `${defender.name.toUpperCase()} BEVE ${sipsToDrink}🍺 DA ${attacker.name.toUpperCase()}!`,
            subtitle: `Attacco subito (${state.topCard.label}${SUIT_INFO[state.topCard.suit].symbol}) + 1 carta. Tocca a ${state.players[nextActive].name}.`,
            tone: 'drink',
          },
          logs: [
            makeLog(
              `🍺 ${defender.name} incassa l'attacco: beve ${sipsToDrink} ${sipsToDrink === 1 ? 'sorso' : 'sorsi'} e pesca 1 carta di penalità.`,
              'drink'
            ),
            ...state.logs,
          ],
        };
      }

      if (state.mode === 'SPECIAL_EVENT') {
        return gameReducer(state, { type: 'RESOLVE_SPECIAL_PASS' });
      }

      return state;
    }

    case 'RESOLVE_SPECIAL_PASS': {
      if (state.mode !== 'SPECIAL_EVENT' || !state.specialEvent) return state;
      const ev = state.specialEvent;

      // 0. DIRECT_SIPS_ATTACK (Target chooses not to use Mirror and drinks the sips)
      if (ev.type === 'DIRECT_SIPS_ATTACK') {
        const targetPlayer = state.players[ev.targetIndex];
        const sipsToGive = ev.sipsAmount;
        const attackerPlayer = state.players[ev.attackerIndex];
        const nextActive = getNextTurnIndex(ev.attackerIndex, state.lastDirection, 1);

        const updatedPlayers = state.players.map((p, idx) =>
          idx === ev.targetIndex
            ? { ...p, sipsDrunk: p.sipsDrunk + sipsToGive }
            : p
        );

        return {
          ...state,
          players: updatedPlayers,
          mode: 'NEUTRAL_FLOW',
          activePlayerIndex: nextActive,
          defenderIndex: null,
          specialEvent: null,
          timer: 7,
          lastDrinkEvent: {
            drinkerIndex: ev.targetIndex,
            drinkerName: targetPlayer.name,
            drinkerSuit: targetPlayer.suit,
            senderIndex: ev.attackerIndex,
            senderName: attackerPlayer.name,
            senderSuit: attackerPlayer.suit,
            sips: sipsToGive,
            reason: `Colpo Diretto (${ev.playedCard.label}) giocato da ${attackerPlayer.name}`,
            cardLabel: ev.playedCard.label,
            cardSuit: ev.playedCard.suit,
          },
          lastActionBanner: {
            title: `COLPO DIRETTO: ${targetPlayer.name.toUpperCase()} BEVE ${sipsToGive}🍺 DA ${attackerPlayer.name.toUpperCase()}!`,
            subtitle: `${targetPlayer.name} incassa il Colpo Diretto! Tocca a ${state.players[nextActive].name}.`,
            tone: 'drink',
          },
          logs: [
            makeLog(
              `🍺 ${targetPlayer.name} non usa lo Specchio e beve ${sipsToGive} ${sipsToGive === 1 ? 'sorso' : 'sorsi'}!`,
              'drink'
            ),
            ...state.logs,
          ],
        };
      }

      // 0b. SKIP_ATTACK (Target non ha o non usa lo Specchio: salta il turno!)
      if (ev.type === 'SKIP_ATTACK') {
        const targetPlayer = state.players[ev.targetIndex];
        const nextActive = getNextTurnIndex(ev.attackerIndex, state.lastDirection, 2);

        return {
          ...state,
          mode: 'NEUTRAL_FLOW',
          specialEvent: null,
          activePlayerIndex: nextActive,
          timer: 7,
          lastActionBanner: {
            title: `SALTA IL TURNO A ${targetPlayer.name.toUpperCase()}!`,
            subtitle: `${targetPlayer.name} salta il turno! Tocca a ${state.players[nextActive].name}.`,
            tone: 'special',
          },
          logs: [
            makeLog(
              `⏭️ ${targetPlayer.name} subisce il Salta Turno e salta il proprio turno. Tocca a ${state.players[nextActive].name}.`,
              'special'
            ),
            ...state.logs,
          ],
        };
      }

      // 1. JACK_SPY
      if (ev.type === 'JACK_SPY') {
        if (ev.phase === 'AWAITING_COUNTER') {
          return {
            ...state,
            timer: 7,
            specialEvent: {
              ...ev,
              phase: 'SPYING_ATTACK',
            },
            lastActionBanner: {
              title: `MANO DI ${state.players[ev.targetIndex].name.toUpperCase()} SVELATA!`,
              subtitle: `${state.players[ev.attackerIndex].name} vede le carte di ${state.players[ev.targetIndex].name}!`,
              tone: 'special',
            },
            logs: [
              makeLog(
                `👁️ ${state.players[ev.attackerIndex].name} spia la mano di ${state.players[ev.targetIndex].name}!`,
                'special'
              ),
              ...state.logs,
            ],
          };
        } else {
          const nextActive = getNextTurnIndex(ev.attackerIndex, state.lastDirection, 1);
          return {
            ...state,
            mode: 'NEUTRAL_FLOW',
            activePlayerIndex: nextActive,
            specialEvent: null,
            timer: 7,
            lastActionBanner: {
              title: `Spionaggio Concluso`,
              subtitle: `Turno a ${state.players[nextActive].name}.`,
              tone: 'neutral',
            },
          };
        }
      }

      // 2. QUEEN_BURDEN
      if (ev.type === 'QUEEN_BURDEN') {
        const victimIdx =
          ev.phase === 'SELECTING_REDIRECT_TARGET' ? ev.attackerIndex : ev.targetIndex;
        const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
          state.deck,
          state.discardPile,
          2
        );

        const updatedPlayers = state.players.map((p, idx) =>
          idx === victimIdx ? { ...p, hand: [...p.hand, ...drawn] } : p
        );

        const nextActive = getNextTurnIndex(ev.targetIndex, state.lastDirection, 1);

        return {
          ...state,
          deck: newDeck,
          discardPile: newDiscardPile,
          players: updatedPlayers,
          mode: 'NEUTRAL_FLOW',
          activePlayerIndex: nextActive,
          defenderIndex: null,
          specialEvent: null,
          timer: 7,
          lastActionBanner: {
            title: `${state.players[victimIdx].name} pesca +2 Carte!`,
            subtitle: `Turno a ${state.players[nextActive].name}.`,
            tone: 'special',
          },
          logs: [
            makeLog(
              `📥 ${state.players[victimIdx].name} subisce la Regina e pesca 2 carte dal mazzo.`,
              'info'
            ),
            ...state.logs,
          ],
        };
      }

      // 3. KING_TOAST
      if (ev.type === 'KING_TOAST') {
        const attackerIdx = ev.attackerIndex;
        const kingPlayer = state.players[attackerIdx];
        const updatedPlayers = state.players.map((p, idx) =>
          idx !== attackerIdx ? { ...p, sipsDrunk: p.sipsDrunk + 1 } : p
        );
        const nextActive = getNextTurnIndex(attackerIdx, state.lastDirection, 1);

        return {
          ...state,
          players: updatedPlayers,
          mode: 'NEUTRAL_FLOW',
          activePlayerIndex: nextActive,
          defenderIndex: null,
          specialEvent: null,
          timer: 7,
          lastDrinkEvent: {
            drinkerIndex: -1,
            drinkerName: 'Tutti gli avversari',
            drinkerSuit: kingPlayer.suit,
            senderIndex: attackerIdx,
            senderName: kingPlayer.name,
            senderSuit: kingPlayer.suit,
            sips: 1,
            reason: `Brindisi del Re 👑 offerto da ${kingPlayer.name}`,
            cardLabel: 'K 👑',
            cardSuit: ev.playedCard.suit,
          },
          lastActionBanner: {
            title: `BRINDISI REALE: TUTTI BEVONO 1🍺 DA ${kingPlayer.name.toUpperCase()}!`,
            subtitle: `Tutti gli avversari di ${kingPlayer.name} bevono 1 sorso! Turno a ${state.players[nextActive].name}.`,
            tone: 'drink',
          },
          logs: [
            makeLog(
              `🍻 Brindisi Reale! Tutti tranne ${state.players[attackerIdx].name} bevono 1 sorso.`,
              'drink'
            ),
            ...state.logs,
          ],
        };
      }

      // 4. ACE_CASCADE
      if (ev.type === 'ACE_CASCADE') {
        const loserIdx = ev.currentResponderIndex;
        const loser = state.players[loserIdx];
        const { drawn, newDeck, newDiscardPile } = drawCardsFromDeck(
          state.deck,
          state.discardPile,
          1
        );

        const updatedPlayers = state.players.map((p, idx) =>
          idx === loserIdx
            ? {
                ...p,
                sipsDrunk: p.sipsDrunk + 2,
                hand: [...p.hand, ...drawn],
              }
            : p
        );

        const nextActive = getNextTurnIndex(loserIdx, state.lastDirection, 1);

        return {
          ...state,
          deck: newDeck,
          discardPile: newDiscardPile,
          players: updatedPlayers,
          mode: 'NEUTRAL_FLOW',
          activePlayerIndex: nextActive,
          defenderIndex: null,
          specialEvent: null,
          timer: 7,
          lastDrinkEvent: {
            drinkerIndex: loserIdx,
            drinkerName: loser.name,
            drinkerSuit: loser.suit,
            senderIndex: ev.initiatorIndex,
            senderName: state.players[ev.initiatorIndex].name,
            senderSuit: state.players[ev.initiatorIndex].suit,
            sips: 2,
            reason: `Cascata dell'Asso 🌊 (${SUIT_INFO[ev.cascadeSuit].name}) lanciata da ${state.players[ev.initiatorIndex].name}`,
            cardLabel: 'A 🌊',
            cardSuit: ev.cascadeSuit,
          },
          lastActionBanner: {
            title: `CASCATA INTERROTTA: ${loser.name.toUpperCase()} BEVE 2🍺 DA ${state.players[ev.initiatorIndex].name.toUpperCase()}!`,
            subtitle: `${loser.name} beve 2 sorsi e pesca 1 carta! Turno a ${state.players[nextActive].name}.`,
            tone: 'drink',
          },
          logs: [
            makeLog(
              `💥 ${loser.name} interrompe la Cascata d'Asso: beve 2 sorsi e pesca 1 carta!`,
              'drink'
            ),
            ...state.logs,
          ],
        };
      }

      return state;
    }

    case 'TICK_TIMER': {
      if (state.mode !== 'ATTACK_CHAIN' && state.mode !== 'SPECIAL_EVENT') {
        return state;
      }

      if (state.timer > 1) {
        return {
          ...state,
          timer: state.timer - 1,
        };
      }

      if (state.mode === 'ATTACK_CHAIN') {
        return gameReducer(state, { type: 'TAKE_SIPS' });
      }

      if (state.mode === 'SPECIAL_EVENT') {
        return gameReducer(state, { type: 'RESOLVE_SPECIAL_PASS' });
      }

      return state;
    }

    default:
      return state;
  }
}

/**
 * Computes the next tactical move for an AI / PC bot player
 */
export function computeAIMove(state: GameState): GameAction | null {
  if (state.mode === 'GAME_OVER') return null;

  const controllingIdx = getControllingPlayerIndex(state);
  const bot = state.players[controllingIdx];
  if (!bot || !bot.isAI) return null;

  const opponents = state.players.filter((p) => p.id !== controllingIdx);
  const priorityOpponent =
    [...opponents].sort((a, b) => a.hand.length - b.hand.length)[0] ||
    state.players[getNextTurnIndex(controllingIdx, state.lastDirection, 1)];

  // 1. NEUTRAL_FLOW
  if (state.mode === 'NEUTRAL_FLOW' && state.activePlayerIndex === controllingIdx) {
    // 0a. Vendetta dei Sorsi: Se il bot ha sbloccato carte penalità da assegnare, colpisce l'avversario più avanti
    const availableSipCards = getAvailableSipCards(bot, state.deckConfig?.sipRewardThreshold);
    if (availableSipCards > 0) {
      return {
        type: 'DEAL_SIP_PENALTY_CARD',
        targetPlayerIndex: priorityOpponent.id,
      };
    }

    // 0b. Sorso Tattico: Se consentito e manca solo 1 sorso per sbloccare la carta penalità contro chi ha poche carte (<= 3)
    if (
      state.deckConfig?.allowVoluntarySip &&
      state.deckConfig?.sipRewardThreshold &&
      state.deckConfig.sipRewardThreshold !== 'none'
    ) {
      const { neededForNext } = getSipsProgressToNextCard(bot, state.deckConfig.sipRewardThreshold);
      if (neededForNext === 1 && priorityOpponent.hand.length <= 3) {
        return {
          type: 'DRINK_VOLUNTARY_SIP',
        };
      }
    }

    // 1a. Direct Sips Event Card (single card, playable when topCard has an opponent's suit)
    const playableDirectSips = bot.hand
      .filter(
        (c) =>
          c.eventKind === 'DIRECT_SIPS' &&
          getCardPlayability(state, controllingIdx, c).playable
      )
      .sort((a, b) => (b.sipsAmount || 0) - (a.sipsAmount || 0));
    if (playableDirectSips.length > 0) {
      return {
        type: 'PLAY_CARDS',
        cardIds: [playableDirectSips[0].id],
      };
    }

    // 1b. Combo (Coppia or Tris) of own suit linked to topCard
    const ownSuitNumberCards = bot.hand.filter(
      (c) => !c.eventKind && c.suit === bot.suit && c.value >= 2 && c.value <= 10
    );
    for (const ownCard of ownSuitNumberCards) {
      const matchingValueCards = bot.hand
        .filter((c) => !c.eventKind && c.value === ownCard.value)
        .slice(0, 3);
      if (
        matchingValueCards.length >= 2 &&
        validateCardSelection(state, controllingIdx, matchingValueCards).valid
      ) {
        return {
          type: 'PLAY_CARDS',
          cardIds: matchingValueCards.map((c) => c.id),
        };
      }
    }

    // 1c. Single Faction Attack (must be playable / linked to topCard)
    const playableAttacks = ownSuitNumberCards
      .filter((c) => getCardPlayability(state, controllingIdx, c).actionType === 'FACTION_ATTACK')
      .sort((a, b) => b.value - a.value);
    if (playableAttacks.length > 0) {
      return {
        type: 'PLAY_CARDS',
        cardIds: [playableAttacks[0].id],
      };
    }

    // 1d. Event Cards (Stop, Cambio Giro, Rossi+2, Neri+2, Tutti+1, Scambio DX, Tassa, Duello, Super Duello)
    const soloEventCards = bot.hand.filter(
      (c) =>
        c.eventKind &&
        c.eventKind !== 'DIRECT_SIPS' &&
        getCardPlayability(state, controllingIdx, c).playable
    );
    if (soloEventCards.length > 0) {
      return {
        type: 'PLAY_CARDS',
        cardIds: [soloEventCards[0].id],
        targetPlayerIndex: priorityOpponent.id,
      };
    }

    // 1e. Link Discard (Scarto di Collegamento)
    const linkCards = bot.hand.filter(
      (c) =>
        getCardPlayability(state, controllingIdx, c).playable &&
        getCardPlayability(state, controllingIdx, c).actionType === 'LINK_DISCARD'
    );
    if (linkCards.length > 0) {
      return {
        type: 'PLAY_CARDS',
        cardIds: [linkCards[0].id],
      };
    }

    // 1f. Power Cards (A, J, Q, K) that are playable (linked to topCard)
    const powerCards = bot.hand.filter(
      (c) =>
        !c.eventKind &&
        (c.value === 1 || c.value >= 11) &&
        getCardPlayability(state, controllingIdx, c).playable
    );
    if (powerCards.length > 0) {
      return {
        type: 'PLAY_CARDS',
        cardIds: [powerCards[0].id],
        targetPlayerIndex: priorityOpponent.id,
      };
    }

    // Otherwise Draw and Pass
    return { type: 'DRAW_AND_PASS' };
  }

  // 2. ATTACK_CHAIN (Bot is defending)
  if (state.mode === 'ATTACK_CHAIN' && state.defenderIndex === controllingIdx) {
    const playableDefenses = bot.hand
      .map((card) => ({
        card,
        info: getCardPlayability(state, controllingIdx, card),
      }))
      .filter((item) => item.info.playable);

    if (playableDefenses.length === 0) {
      return { type: 'TAKE_SIPS' };
    }

    const scoreDefense = (actionType?: CardPlayability['actionType'], card?: Card) => {
      const sameSuit = card?.suit === state.topCard.suit;
      if (actionType === 'DEFENSE_MIRROR') return 110;
      if (actionType === 'DEFENSE_COUNTER' || actionType === 'DEFENSE_DEVIATE') {
        return sameSuit ? 100 : 80;
      }
      if (actionType === 'DEFENSE_SHIELD' || actionType === 'DEFENSE_STOP') return 60;
      if (actionType === 'DEFENSE_SHOCK') return 40;
      return 10;
    };

    playableDefenses.sort(
      (a, b) =>
        scoreDefense(b.info.actionType, b.card) - scoreDefense(a.info.actionType, a.card)
    );

    return {
      type: 'PLAY_CARDS',
      cardIds: [playableDefenses[0].card.id],
    };
  }

  // 3. SPECIAL_EVENT
  if (state.mode === 'SPECIAL_EVENT' && state.specialEvent) {
    const ev = state.specialEvent;

    if (ev.type === 'QUEEN_BURDEN' && ev.phase === 'SELECTING_REDIRECT_TARGET') {
      return {
        type: 'SELECT_QUEEN_REDIRECT',
        targetPlayerIndex: priorityOpponent.id,
      };
    }

    const playableSpecial = bot.hand.filter(
      (c) => getCardPlayability(state, controllingIdx, c).playable
    );

    if (playableSpecial.length > 0) {
      const beffaCard = playableSpecial.find(
        (c) => getCardPlayability(state, controllingIdx, c).actionType === 'SPECIAL_BEFFA_6'
      );
      const chosen = beffaCard || playableSpecial[0];
      return {
        type: 'PLAY_CARDS',
        cardIds: [chosen.id],
      };
    }

    return { type: 'RESOLVE_SPECIAL_PASS' };
  }

  return null;
}
