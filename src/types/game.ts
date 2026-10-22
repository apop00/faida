export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type GameMode = 'NEUTRAL_FLOW' | 'ATTACK_CHAIN' | 'SPECIAL_EVENT' | 'GAME_OVER';

export type Direction = 'forward' | 'backward';

export type MatchPreset = '1P_3PC' | '2P_2PC' | '3P_1PC' | '4P_0PC';

export type EventCardKind =
  | 'DIRECT_SIPS' // 4x 1🍺, 4x 2🍺, 2x 3🍺, 1x 5🍺 (played on opponent's suit on table)
  | 'REVERSE_SUIT' // 4x Cambio Giro (1 per suit)
  | 'STOP_SUIT' // 8x Stop (4 in initial hands + 4 in deck)
  | 'PASS_RIGHT' // 1x Tutti cambiano 1 carta col vicino di destra
  | 'RED_DRAW_2' // 1x Rossi (♥♦) pescano 2 carte
  | 'BLACK_DRAW_2' // 1x Neri (♣♠) pescano 2 carte
  | 'ALL_DRAW_1' // 1x Tutti pescano 1 carta
  | 'MIRROR' // 2x Specchio (riflette attacchi e Sorsi Diretti al mittente)
  | 'TAX_RICH' // 1x Tassa sui Ricchi (chi ha meno carte pesca +2 e beve 1🍺)
  | 'DUEL_HIGH' // 2x Duello 1v1 Carta Alta (2-10: chi fa il numero più basso beve 2🍺)
  | 'DUEL_LOW' // 2x Duello 1v1 Carta Bassa (2-10: chi fa il numero più alto beve 2🍺)
  | 'SUPER_DUEL_HIGH' // 1x Super Duello Tutti Carta Alta (2-10: il più basso beve 2🍺)
  | 'SUPER_DUEL_LOW'; // 1x Super Duello Tutti Carta Bassa (2-10: il più alto beve 2🍺)

export type Card = {
  id: string;
  suit: Suit;
  value: number; // 1 (A) .. 13 (K), or 0 for pure Event Cards
  label: string; // 'A', '2'-'10', 'J', 'Q', 'K', or event label ('1🍺', '🔄', '🚫', etc.)
  eventKind?: EventCardKind;
  sipsAmount?: number; // for DIRECT_SIPS: 1, 2, 3, or 5
};

export type Player = {
  id: number;
  name: string;
  suit: Suit;
  hand: Card[];
  sipsDrunk: number;
  isAI?: boolean;
  clientPlayerId?: string;
  attacksLaunched?: number;
  defensesSucceeded?: number;
};

export type LobbySlot = {
  slotIndex: number;
  suit: Suit;
  name: string;
  isAI: boolean;
  clientPlayerId: string | null;
  isHost?: boolean;
};

export type LobbyRoom = {
  code: string;
  roomName: string;
  isPublic: boolean;
  preset: MatchPreset;
  hostClientId: string;
  status: 'waiting' | 'playing';
  createdAt: string;
  updatedAt: string;
  slots: LobbySlot[];
  gameState: GameState | null;
};

export type SpecialEventState =
  | {
      type: 'JACK_SPY';
      attackerIndex: number;
      targetIndex: number;
      phase: 'AWAITING_COUNTER' | 'SPYING_ATTACK';
      playedCard: Card;
    }
  | {
      type: 'QUEEN_BURDEN';
      attackerIndex: number;
      targetIndex: number;
      phase: 'AWAITING_RESPONSE' | 'SELECTING_REDIRECT_TARGET';
      playedCard: Card;
    }
  | {
      type: 'KING_TOAST';
      attackerIndex: number;
      responderIndex: number;
      playedCard: Card;
    }
  | {
      type: 'ACE_CASCADE';
      initiatorIndex: number;
      currentResponderIndex: number;
      cascadeSuit: Suit;
      cardsPlayedInCascade: number;
      playedCard: Card;
    }
  | {
      type: 'DIRECT_SIPS_ATTACK';
      attackerIndex: number;
      targetIndex: number;
      sipsAmount: number;
      playedCard: Card;
    };

export type CardPlayability = {
  playable: boolean;
  actionType?:
    | 'FACTION_ATTACK'
    | 'COMBO_COMPANION'
    | 'LINK_DISCARD'
    | 'POWER_JACK'
    | 'POWER_QUEEN'
    | 'POWER_KING'
    | 'POWER_ACE'
    | 'EVENT_DIRECT_SIPS'
    | 'EVENT_SIPS_SUIT_COMPANION'
    | 'EVENT_REVERSE'
    | 'EVENT_STOP'
    | 'EVENT_PASS_RIGHT'
    | 'EVENT_RED_DRAW_2'
    | 'EVENT_BLACK_DRAW_2'
    | 'EVENT_ALL_DRAW_1'
    | 'EVENT_TAX_RICH'
    | 'EVENT_DUEL_HIGH'
    | 'EVENT_DUEL_LOW'
    | 'EVENT_SUPER_DUEL_HIGH'
    | 'EVENT_SUPER_DUEL_LOW'
    | 'DEFENSE_COUNTER' // -1
    | 'DEFENSE_DEVIATE' // +1
    | 'DEFENSE_SHOCK' // same value
    | 'DEFENSE_SHIELD' // same suit > value
    | 'DEFENSE_STOP' // Stop card used in defense
    | 'DEFENSE_MIRROR' // Mirror card used in defense
    | 'SPECIAL_COUNTER_JACK'
    | 'SPECIAL_COUNTER_QUEEN'
    | 'SPECIAL_BEFFA_6'
    | 'SPECIAL_COUNTER_KING'
    | 'SPECIAL_CASCADE_SUIT'
    | 'SPECIAL_COUNTER_MIRROR'
    | 'SPY_DIRECT_ATTACK';
  badgeLabel?: string;
  sipsPreview?: number;
};

export type GameLogEntry = {
  id: string;
  timestamp: number;
  text: string;
  type: 'info' | 'attack' | 'defense' | 'drink' | 'special' | 'bonus';
};

export type ActiveDuelState = {
  duelKind: 'DUEL_HIGH' | 'DUEL_LOW' | 'SUPER_DUEL_HIGH' | 'SUPER_DUEL_LOW';
  initiatorIndex: number;
  targetIndex?: number;
  participants: {
    player: Player;
    card: Card;
  }[];
  loserIndex: number;
  loserIndices: number[];
  isTie?: boolean;
  sipsToDrink: number;
};

export type LastDrinkEvent = {
  drinkerIndex: number;
  drinkerName: string;
  drinkerSuit: Suit;
  senderIndex?: number;
  senderName?: string;
  senderSuit?: Suit;
  sips: number;
  reason: string;
  cardLabel?: string;
  cardSuit?: Suit;
};

export type GameState = {
  deck: Card[];
  discardPile: Card[];
  targetCard: Card;
  topCard: Card;
  players: Player[];
  activePlayerIndex: number;
  defenderIndex: number | null;
  mode: GameMode;
  currentSips: number;
  timer: number;
  lastDirection: Direction;
  specialEvent: SpecialEventState | null;
  activeDuel?: ActiveDuelState | null;
  winnerIndex: number | null;
  lastActionBanner: {
    title: string;
    subtitle: string;
    tone: 'neutral' | 'attack' | 'defense' | 'drink' | 'special' | 'bonus';
  } | null;
  lastDrinkEvent?: LastDrinkEvent | null;
  logs: GameLogEntry[];
};

export type GameAction =
  | {
      type: 'INIT_GAME';
      playerNames?: string[];
      aiFlags?: boolean[];
      customState?: Partial<GameState>;
    }
  | { type: 'SYNC_STATE'; nextState: GameState }
  | { type: 'PLAY_CARDS'; cardIds: string[]; targetPlayerIndex?: number }
  | { type: 'USE_TARGET_BONUS'; cardId: string; sipDistribution: { [playerIndex: number]: number } }
  | { type: 'DRAW_AND_PASS' }
  | { type: 'TAKE_SIPS' }
  | { type: 'TICK_TIMER' }
  | { type: 'RESOLVE_SPECIAL_PASS' }
  | { type: 'SELECT_QUEEN_REDIRECT'; targetPlayerIndex: number }
  | { type: 'DISMISS_DUEL' };
