import { describe, it, expect } from 'vitest';
import {
  computeAIMove,
  createInitialGameState,
  gameReducer,
  getCardPlayability,
  getNextValue,
  getPrevValue,
  getTargetBonusCards,
  validateCardSelection,
} from '@/lib/gameEngine';
import { Card, GameState } from '@/types/game';

function card(suit: Card['suit'], value: number, suffix = ''): Card {
  const labels: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  return {
    id: `${suit}-${value}${suffix}`,
    suit,
    value,
    label: labels[value] || String(value),
  };
}

describe('Colpo Basso: Faida di Semi - Game Engine & Rules', () => {
  it('Setup Iniziale: 88 cards (52 standard + 36 event), 8 per player with 1 guaranteed STOP each + 4 STOP in deck', () => {
    const state = createInitialGameState(['Marco', 'Luca', 'Sara', 'Giulia']);
    expect(state.players).toHaveLength(4);
    expect(state.players[0].suit).toBe('hearts');
    expect(state.players[1].suit).toBe('diamonds');
    expect(state.players[2].suit).toBe('clubs');
    expect(state.players[3].suit).toBe('spades');

    state.players.forEach((p) => {
      expect(p.hand).toHaveLength(8);
      expect(p.hand.some((c) => c.eventKind === 'STOP_SUIT')).toBe(true);
      expect(p.sipsDrunk).toBe(0);
    });

    expect(state.topCard.id).toBe(state.targetCard.id);
    expect(state.targetCard.eventKind).toBeUndefined();
    expect(state.players[state.activePlayerIndex].suit).toBe(state.targetCard.suit);
    expect(state.deck).toHaveLength(88 - 32 - 1);
    expect(state.deck.filter((c) => c.eventKind === 'STOP_SUIT')).toHaveLength(4);
  });

  it('Sequenza Circolare: K (13) <-> A (1) <-> 2', () => {
    expect(getNextValue(13)).toBe(1);
    expect(getNextValue(1)).toBe(2);
    expect(getPrevValue(1)).toBe(13);
    expect(getPrevValue(2)).toBe(1);
  });

  it('Carta Bersaglio rimossa: getTargetBonusCards restituisce sempre array vuoto', () => {
    const base = createInitialGameState();
    expect(getTargetBonusCards(base, 0)).toHaveLength(0);
  });

  it('NEUTRAL_FLOW: Innesco Attacco singolo (1 sorso), Coppia (2 sorsi), Tris (3 sorsi) e Poker (4 sorsi) collegati a TopCard', () => {
    const base = createInitialGameState();
    const top = card('hearts', 5);
    const c7h = card('hearts', 7);
    const c7d = card('diamonds', 7);
    const c7c = card('clubs', 7);
    const c7s = card('spades', 7);
    const c3h = card('hearts', 3);

    const stateSingle: GameState = {
      ...base,
      topCard: top,
      activePlayerIndex: 0,
      players: base.players.map((p, i) =>
        i === 0 ? { ...p, hand: [c3h, c7h, c7d, c7c, c7s] } : p
      ),
    };

    // Value 3 -> 1 base sip (linked to topCard via suit 'hearts')
    const res1 = gameReducer(stateSingle, {
      type: 'PLAY_CARDS',
      cardIds: [c3h.id],
    });
    expect(res1.mode).toBe('ATTACK_CHAIN');
    expect(res1.currentSips).toBe(1);
    expect(res1.defenderIndex).toBe(1);
    expect(res1.timer).toBe(7);

    // Coppia of 7s -> 2 sorsi
    const resPair = gameReducer(stateSingle, {
      type: 'PLAY_CARDS',
      cardIds: [c7h.id, c7d.id],
    });
    expect(resPair.mode).toBe('ATTACK_CHAIN');
    expect(resPair.currentSips).toBe(2);

    // Tris of 7s -> 3 sorsi
    const resTris = gameReducer(stateSingle, {
      type: 'PLAY_CARDS',
      cardIds: [c7h.id, c7d.id, c7c.id],
    });
    expect(resTris.mode).toBe('ATTACK_CHAIN');
    expect(resTris.currentSips).toBe(3);

    // Poker of 7s -> 4 sorsi
    const resPoker = gameReducer(stateSingle, {
      type: 'PLAY_CARDS',
      cardIds: [c7h.id, c7d.id, c7c.id, c7s.id],
    });
    expect(resPoker.mode).toBe('ATTACK_CHAIN');
    expect(resPoker.currentSips).toBe(4);
  });

  it('NEUTRAL_FLOW: Obbligo di Collegamento (non puoi buttare carte scollegate dal seme/numero a terra)', () => {
    const base = createInitialGameState();
    const top = card('clubs', 8);
    const validSameSuit = card('clubs', 4);
    const validSameVal = card('diamonds', 8);
    const unlinkedOwnSuit = card('hearts', 3);
    const invalidCard = card('spades', 3);

    const state: GameState = {
      ...base,
      topCard: top,
      activePlayerIndex: 0, // hearts
      players: base.players.map((p, i) =>
        i === 0
          ? { ...p, hand: [validSameSuit, validSameVal, unlinkedOwnSuit, invalidCard] }
          : p
      ),
    };

    expect(getCardPlayability(state, 0, validSameSuit).actionType).toBe('LINK_DISCARD');
    expect(getCardPlayability(state, 0, validSameVal).actionType).toBe('LINK_DISCARD');
    expect(getCardPlayability(state, 0, unlinkedOwnSuit).playable).toBe(false);
    expect(getCardPlayability(state, 0, invalidCard).playable).toBe(false);

    const next = gameReducer(state, {
      type: 'PLAY_CARDS',
      cardIds: [validSameSuit.id],
    });
    expect(next.mode).toBe('NEUTRAL_FLOW');
    expect(next.currentSips).toBe(0);
    expect(next.topCard.id).toBe(validSameSuit.id);
    expect(next.activePlayerIndex).toBe(1);
  });

  it('ATTACK_CHAIN: Contrattacco (-1), Deviazione (+1), Raddoppio stesso seme, Contro-Shock (=), Scudo Alto (> top) e Incasso', () => {
    const base = createInitialGameState();
    const attackCard = card('hearts', 7); // 2 sips from Player 0 to Player 1
    const counterSameSuit = card('hearts', 6); // -1 same suit -> doubles 2 to 4, back to Player 0
    const deviateDiffSuit = card('clubs', 8); // +1 diff suit -> keeps 2, forward to Player 2
    const shockCard = card('spades', 7); // same value -> both drink 1, neutral flow to Player 2
    const lowSameSuitCard = card('hearts', 2); // lower value than 7 -> NOT playable as shield anymore!
    const highShieldCard = card('hearts', 10); // higher value than 7 -> valid Scudo Alto (0 sips)

    const attackState: GameState = {
      ...base,
      mode: 'ATTACK_CHAIN',
      activePlayerIndex: 0,
      defenderIndex: 1,
      topCard: attackCard,
      currentSips: 2,
      timer: 7,
      players: base.players.map((p, i) =>
        i === 1
          ? {
              ...p,
              hand: [
                counterSameSuit,
                deviateDiffSuit,
                shockCard,
                lowSameSuitCard,
                highShieldCard,
                card('diamonds', 10),
              ],
            }
          : p
      ),
    };

    // Low same-suit card (2♥ on 7♥) cannot block
    expect(getCardPlayability(attackState, 1, lowSameSuitCard).playable).toBe(false);
    // High same-suit card (10♥ on 7♥) blocks as DEFENSE_SHIELD
    expect(getCardPlayability(attackState, 1, highShieldCard).actionType).toBe(
      'DEFENSE_SHIELD'
    );

    // 1. Contrattacco (-1) same suit -> 4 sips back to Player 0
    const afterCounter = gameReducer(attackState, {
      type: 'PLAY_CARDS',
      cardIds: [counterSameSuit.id],
    });
    expect(afterCounter.mode).toBe('ATTACK_CHAIN');
    expect(afterCounter.currentSips).toBe(4);
    expect(afterCounter.activePlayerIndex).toBe(1);
    expect(afterCounter.defenderIndex).toBe(0);
    expect(afterCounter.lastDirection).toBe('backward');

    // 2. Deviazione (+1) diff suit -> 2 sips forward to Player 2
    const afterDeviate = gameReducer(attackState, {
      type: 'PLAY_CARDS',
      cardIds: [deviateDiffSuit.id],
    });
    expect(afterDeviate.mode).toBe('ATTACK_CHAIN');
    expect(afterDeviate.currentSips).toBe(2);
    expect(afterDeviate.activePlayerIndex).toBe(1);
    expect(afterDeviate.defenderIndex).toBe(2);
    expect(afterDeviate.lastDirection).toBe('forward');

    // 3. Contro-Shock (=) -> both drink 1 sip, neutral flow to Player 2
    const afterShock = gameReducer(attackState, {
      type: 'PLAY_CARDS',
      cardIds: [shockCard.id],
    });
    expect(afterShock.mode).toBe('NEUTRAL_FLOW');
    expect(afterShock.players[0].sipsDrunk).toBe(1);
    expect(afterShock.players[1].sipsDrunk).toBe(1);
    expect(afterShock.activePlayerIndex).toBe(2);

    // 4. Scudo Alto (10♥ on 7♥) -> 0 sips, neutral flow to Player 2
    const afterShield = gameReducer(attackState, {
      type: 'PLAY_CARDS',
      cardIds: [highShieldCard.id],
    });
    expect(afterShield.mode).toBe('NEUTRAL_FLOW');
    expect(afterShield.players[0].sipsDrunk).toBe(0);
    expect(afterShield.players[1].sipsDrunk).toBe(0);
    expect(afterShield.activePlayerIndex).toBe(2);

    // 5. Incasso (TAKE_SIPS) -> defender drinks 2 and draws 1 card
    const handCountBefore = attackState.players[1].hand.length;
    const afterTake = gameReducer(attackState, { type: 'TAKE_SIPS' });
    expect(afterTake.mode).toBe('NEUTRAL_FLOW');
    expect(afterTake.players[1].sipsDrunk).toBe(2);
    expect(afterTake.players[1].hand).toHaveLength(handCountBefore + 1);
    expect(afterTake.activePlayerIndex).toBe(2);
  });

  it('Carte Potere: Fante (J), Regina (Q + Contro-Regina + Beffa del 6), Re (K + Regicidio), Asso (A Cascata)', () => {
    const base = createInitialGameState();

    // --- REGINA & BEFFA DEL 6 ---
    const qHearts = card('hearts', 12);
    const sixHearts = card('hearts', 6);
    const extraCard = card('clubs', 2);

    const stateQueen: GameState = {
      ...base,
      topCard: card('hearts', 4),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, i) => {
        if (i === 0) return { ...p, hand: [qHearts, extraCard] };
        if (i === 1) return { ...p, hand: [sixHearts, card('diamonds', 4)] };
        return p;
      }),
    };

    const qPlayed = gameReducer(stateQueen, {
      type: 'PLAY_CARDS',
      cardIds: [qHearts.id],
      targetPlayerIndex: 1,
    });
    expect(qPlayed.mode).toBe('SPECIAL_EVENT');
    expect(qPlayed.specialEvent?.type).toBe('QUEEN_BURDEN');

    // Player 1 plays 6 of Hearts (Beffa del 6)
    const beffaPlayed = gameReducer(qPlayed, {
      type: 'PLAY_CARDS',
      cardIds: [sixHearts.id],
    });
    expect(beffaPlayed.specialEvent?.type).toBe('QUEEN_BURDEN');
    if (beffaPlayed.specialEvent?.type === 'QUEEN_BURDEN') {
      expect(beffaPlayed.specialEvent.phase).toBe('SELECTING_REDIRECT_TARGET');
    }

    // Redirect 2 cards to Player 3
    const p3CardsBefore = beffaPlayed.players[3].hand.length;
    const redirected = gameReducer(beffaPlayed, {
      type: 'SELECT_QUEEN_REDIRECT',
      targetPlayerIndex: 3,
    });
    expect(redirected.mode).toBe('NEUTRAL_FLOW');
    expect(redirected.players[3].hand).toHaveLength(p3CardsBefore + 2);

    // --- RE & REGICIDIO ---
    const kClubs = card('clubs', 13);
    const kSpades = card('spades', 13);
    const stateKing: GameState = {
      ...base,
      topCard: card('clubs', 5),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, i) => {
        if (i === 0) return { ...p, hand: [kClubs, extraCard] };
        if (i === 1) return { ...p, hand: [kSpades, card('diamonds', 4)] };
        return p;
      }),
    };

    const kingPlayed = gameReducer(stateKing, {
      type: 'PLAY_CARDS',
      cardIds: [kClubs.id],
    });
    expect(kingPlayed.mode).toBe('SPECIAL_EVENT');
    expect(kingPlayed.specialEvent?.type).toBe('KING_TOAST');

    // Regicidio by Player 1
    const regicidio = gameReducer(kingPlayed, {
      type: 'PLAY_CARDS',
      cardIds: [kSpades.id],
    });
    expect(regicidio.mode).toBe('NEUTRAL_FLOW');
    expect(regicidio.players[0].sipsDrunk).toBe(5);
    expect(regicidio.players[1].sipsDrunk).toBe(0);

    // --- ASSO CASCATA ---
    const aDiamonds = card('diamonds', 1);
    const d5 = card('diamonds', 5);
    const stateAce: GameState = {
      ...base,
      topCard: card('diamonds', 9),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, i) => {
        if (i === 0) return { ...p, hand: [aDiamonds, extraCard] };
        if (i === 1) return { ...p, hand: [d5, card('hearts', 4)] };
        return p;
      }),
    };

    const acePlayed = gameReducer(stateAce, {
      type: 'PLAY_CARDS',
      cardIds: [aDiamonds.id],
    });
    expect(acePlayed.mode).toBe('SPECIAL_EVENT');
    expect(acePlayed.timer).toBe(5);

    // Player 1 continues cascade with d5
    const cascadeStep1 = gameReducer(acePlayed, {
      type: 'PLAY_CARDS',
      cardIds: [d5.id],
    });
    expect(cascadeStep1.mode).toBe('SPECIAL_EVENT');
    expect(cascadeStep1.timer).toBe(5);

    // Player 2 fails cascade -> drinks 2 sips and draws 1 card
    const p2HandBefore = cascadeStep1.players[2].hand.length;
    const cascadeFailed = gameReducer(cascadeStep1, {
      type: 'RESOLVE_SPECIAL_PASS',
    });
    expect(cascadeFailed.mode).toBe('NEUTRAL_FLOW');
    expect(cascadeFailed.players[2].sipsDrunk).toBe(2);
    expect(cascadeFailed.players[2].hand).toHaveLength(p2HandBefore + 1);
    expect(cascadeFailed.activePlayerIndex).toBe(3);
  });

  it('Regola "Colpo Finale": si può chiudere con carte neutre numeriche (2-10), ma non con carte evento o figure (A, J, Q, K)', () => {
    const base = createInitialGameState();
    const neutralLinkLast = card('diamonds', 5);
    const validAttackLast = card('hearts', 9);
    const eventStopLast: Card = { id: 'stop-last', suit: 'hearts', value: 0, label: '🚫', eventKind: 'STOP_SUIT' };
    const kingFigureLast = card('hearts', 13);

    // SI PUÒ vincere con una carta neutra LINK_DISCARD (2-10)
    const stateNeutralLast: GameState = {
      ...base,
      topCard: card('diamonds', 2),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0, // Hearts
      players: base.players.map((p, i) => (i === 0 ? { ...p, hand: [neutralLinkLast] } : p)),
    };
    const neutralPlay = getCardPlayability(stateNeutralLast, 0, neutralLinkLast);
    expect(neutralPlay.playable).toBe(true);
    expect(neutralPlay.badgeLabel).toBe('Colpo Finale! 🏆');

    // NON si può vincere con una carta Evento (es. Stop)
    const stateEventLast: GameState = {
      ...base,
      topCard: card('hearts', 2),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, i) => (i === 0 ? { ...p, hand: [eventStopLast] } : p)),
    };
    expect(getCardPlayability(stateEventLast, 0, eventStopLast).playable).toBe(false);

    // NON si può vincere con una figura / potere (A, J, Q, K)
    const stateFigureLast: GameState = {
      ...base,
      topCard: card('hearts', 2),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, i) => (i === 0 ? { ...p, hand: [kingFigureLast] } : p)),
    };
    expect(getCardPlayability(stateFigureLast, 0, kingFigureLast).playable).toBe(false);

    // CAN win with a FACTION_ATTACK as the last card
    const stateAttackLast: GameState = {
      ...base,
      topCard: card('hearts', 2),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0, // Hearts
      players: base.players.map((p, i) => (i === 0 ? { ...p, hand: [validAttackLast] } : p)),
    };
    expect(getCardPlayability(stateAttackLast, 0, validAttackLast).playable).toBe(true);

    const finalState = gameReducer(stateAttackLast, {
      type: 'PLAY_CARDS',
      cardIds: [validAttackLast.id],
    });

    expect(finalState.mode).toBe('GAME_OVER');
    expect(finalState.winnerIndex).toBe(0);
  });

  it('Punto 1: Qualsiasi carta può essere giocata sopra le carte evento a terra (Jolly di semi)', () => {
    const base = createInitialGameState();
    const eventTopCard: Card = { id: 'ev-top', suit: 'clubs', value: 0, label: '🚫', eventKind: 'STOP_SUIT' };
    const diamondCard = card('diamonds', 7);

    const stateWithEventOnTop: GameState = {
      ...base,
      topCard: eventTopCard,
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 1, // Diamonds player
      players: base.players.map((p, i) => (i === 1 ? { ...p, hand: [diamondCard, card('spades', 3)] } : p)),
    };

    // Diamond card can be played directly on the clubs event card
    const play = getCardPlayability(stateWithEventOnTop, 1, diamondCard);
    expect(play.playable).toBe(true);
    expect(play.actionType).toBe('FACTION_ATTACK');
  });

  it('AI Bot PC (1P vs 3PC): computes valid tactical attacks and defenses', () => {
    const base = createInitialGameState(
      ['Tu', 'Bot Quadri', 'Bot Fiori', 'Bot Picche'],
      [false, true, true, true]
    );
    expect(base.players[0].isAI).toBe(false);
    expect(base.players[1].isAI).toBe(true);

    // Bot 1 (diamonds) turn in NEUTRAL_FLOW with a diamond 9 linked to topCard (diamonds 3)
    const d9 = card('diamonds', 9);
    const botTurnState: GameState = {
      ...base,
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 1,
      topCard: card('diamonds', 3),
      players: base.players.map((p, idx) =>
        idx === 1 ? { ...p, hand: [d9, card('clubs', 2)] } : p
      ),
    };

    const move = computeAIMove(botTurnState);
    expect(move).toEqual({
      type: 'PLAY_CARDS',
      cardIds: [d9.id],
    });
  });

  it('Carte Evento: Sorso Diretto + Specchio (🪞), Tassa sui Ricchi (📉), Duello (⚔️▲/▼) e Super Duello (💥▲/▼)', () => {
    const base = createInitialGameState();
    const sip5Card: Card = {
      id: 'event-sip5-1',
      suit: 'spades',
      value: 0,
      label: '5🍺',
      eventKind: 'DIRECT_SIPS',
      sipsAmount: 5,
    };
    const mirrorCard: Card = {
      id: 'event-mirror-1',
      suit: 'diamonds',
      value: 0,
      label: '🪞',
      eventKind: 'MIRROR',
    };
    const taxRichCard: Card = {
      id: 'event-tax-rich',
      suit: 'diamonds',
      value: 0,
      label: '📉',
      eventKind: 'TAX_RICH',
    };
    const duelHighCard: Card = {
      id: 'event-duel-high-1',
      suit: 'hearts',
      value: 0,
      label: '⚔️▲',
      eventKind: 'DUEL_HIGH',
    };
    const superDuelLowCard: Card = {
      id: 'event-super-duel-low',
      suit: 'spades',
      value: 0,
      label: '💥▼',
      eventKind: 'SUPER_DUEL_LOW',
    };

    // 1. Direct Sips (5🍺) against Player 2 (Clubs) when Player 2 has NO Mirror -> auto-resolves
    const sClubsNoMirror: GameState = {
      ...base,
      topCard: card('clubs', 4),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0, // Hearts
      players: base.players.map((p, idx) => {
        if (idx === 0) return { ...p, hand: [sip5Card, card('hearts', 2)] };
        if (idx === 2) return { ...p, hand: [card('clubs', 3), card('clubs', 9)] };
        return p;
      }),
    };

    const afterDirectNoMirror = gameReducer(sClubsNoMirror, {
      type: 'PLAY_CARDS',
      cardIds: [sip5Card.id],
    });
    expect(afterDirectNoMirror.mode).toBe('NEUTRAL_FLOW');
    expect(afterDirectNoMirror.players[2].sipsDrunk).toBe(5);

    // 2. Direct Sips (5🍺) against Player 2 (Clubs) when Player 2 HAS Mirror -> enters SPECIAL_EVENT and reflects back to Player 0!
    const sClubsWithMirror: GameState = {
      ...base,
      topCard: card('clubs', 4),
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0, // Hearts
      players: base.players.map((p, idx) => {
        if (idx === 0) return { ...p, hand: [sip5Card, card('hearts', 2)] };
        if (idx === 2) return { ...p, hand: [mirrorCard, card('clubs', 9)] };
        return p;
      }),
    };

    const afterDirectWithMirror = gameReducer(sClubsWithMirror, {
      type: 'PLAY_CARDS',
      cardIds: [sip5Card.id],
    });
    expect(afterDirectWithMirror.mode).toBe('SPECIAL_EVENT');
    expect(afterDirectWithMirror.specialEvent?.type).toBe('DIRECT_SIPS_ATTACK');

    const reflected = gameReducer(afterDirectWithMirror, {
      type: 'PLAY_CARDS',
      cardIds: [mirrorCard.id],
    });
    expect(reflected.mode).toBe('NEUTRAL_FLOW');
    expect(reflected.players[0].sipsDrunk).toBe(5);
    expect(reflected.players[2].sipsDrunk).toBe(0);

    // 3. Tassa sui Ricchi (TAX_RICH): opponent with fewest cards draws +2 and drinks 1 sip
    const sTax: GameState = {
      ...base,
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, idx) => {
        if (idx === 0) return { ...p, hand: [taxRichCard, card('hearts', 2)] };
        if (idx === 1) return { ...p, hand: [card('diamonds', 3)] }; // fewest cards (1)
        return p;
      }),
    };
    const afterTax = gameReducer(sTax, {
      type: 'PLAY_CARDS',
      cardIds: [taxRichCard.id],
    });
    expect(afterTax.players[1].hand).toHaveLength(3);
    expect(afterTax.players[1].sipsDrunk).toBe(1);

    // 4. Duello 1v1 (DUEL_HIGH) & Super Duello (SUPER_DUEL_LOW): loser drinks 2 sips
    const sDuel: GameState = {
      ...base,
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, idx) =>
        idx === 0 ? { ...p, hand: [duelHighCard, superDuelLowCard, card('hearts', 2)] } : p
      ),
    };
    const afterDuel1v1 = gameReducer(sDuel, {
      type: 'PLAY_CARDS',
      cardIds: [duelHighCard.id],
      targetPlayerIndex: 2,
    });
    expect([2, 4]).toContain(
      afterDuel1v1.players[0].sipsDrunk + afterDuel1v1.players[2].sipsDrunk
    );
    expect(afterDuel1v1.activeDuel?.loserIndices).toBeDefined();

    const afterSuperDuel = gameReducer(sDuel, {
      type: 'PLAY_CARDS',
      cardIds: [superDuelLowCard.id],
    });
    const totalSipsAfterSuper = afterSuperDuel.players.reduce(
      (acc, p) => acc + p.sipsDrunk,
      0
    );
    expect([2, 4, 6, 8]).toContain(totalSipsAfterSuper);
    expect(afterSuperDuel.activeDuel?.loserIndices.length).toBeGreaterThanOrEqual(1);
  });

  it('Duelli con Parità: in 1v1 entrambi bevono 2 sorsi (+4 totali), in Super Duello tutti i pareggianti bevono', () => {
    const base = createInitialGameState();
    const duelHighCard: Card = {
      id: 'duel-tie-1',
      suit: 'hearts',
      value: 0,
      label: '⚔️▲',
      eventKind: 'DUEL_HIGH',
    };

    // Prepare deck where top 2 numeric cards have IDENTICAL value (e.g. 5 of spades and 5 of diamonds)
    const tieState: GameState = {
      ...base,
      deck: [
        { id: 't1', suit: 'spades', value: 5, label: '5' },
        { id: 't2', suit: 'diamonds', value: 5, label: '5' },
      ],
      discardPile: [],
      mode: 'NEUTRAL_FLOW',
      activePlayerIndex: 0,
      players: base.players.map((p, idx) =>
        idx === 0 ? { ...p, hand: [duelHighCard, card('hearts', 2)] } : p
      ),
    };

    const afterTieDuel = gameReducer(tieState, {
      type: 'PLAY_CARDS',
      cardIds: [duelHighCard.id],
      targetPlayerIndex: 1,
    });

    expect(afterTieDuel.activeDuel?.isTie).toBe(true);
    expect(afterTieDuel.activeDuel?.loserIndices).toEqual([0, 1]);
    expect(afterTieDuel.players[0].sipsDrunk).toBe(2);
    expect(afterTieDuel.players[1].sipsDrunk).toBe(2);
  });
});

