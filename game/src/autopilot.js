// BRANKAS — Deck Heist. The autopilot: a greedy player that values every card
// in the hand, chains suits on purpose, blocks when a big hit is coming, and
// drafts the best card on offer. The same policy plays the live game (?auto),
// stages the screenshots, and proves in tests that a full run can be won.
import { cardById, cardValue, relicById } from './cards.js';
import {
  createRun, startRun, playCard, endTurn, chooseDraft, incomingDamage,
  takeRelic, shopHeal, shopBuyCard, shopRemoveCard, proceedLevel,
  SHOP_BUY_COST, SHOP_REMOVE_COST,
} from './world.js';

/** Value of playing one hand card right now. */
export function scorePlay(state, uid) {
  const entry = state.hand.find((c) => c.uid === uid);
  if (!entry) return -1;
  const card = cardById(entry.id);
  if (state.energy < card.cost) return -1;
  const enemy = state.enemy;
  let v = 0;
  const chainBonus = state.chainSuit === card.suit ? 1.5 : 0;
  if (card.dmg) {
    let perHit = card.dmg + (state.chainCount || 0);
    if (card.comboDmg && (state.chainSuit === card.suit || state.chainCount >= 1)) perHit += card.comboDmg;
    if (card.execute && enemy.hp <= enemy.maxHp / 2) perHit += card.execute;
    const total = perHit * (card.hits || 1);
    const throughBlock = Math.max(0, total - enemy.block);
    if (throughBlock >= enemy.hp) v += 1000; // lethal first
    v += throughBlock * 1.0 + Math.min(total, enemy.block) * 0.25;
  }
  const incoming = incomingDamage(state);
  if (card.block) v += Math.min(card.block, Math.max(0, incoming - state.block)) * 1.3 + card.block * 0.15;
  if (card.gold) v += card.gold * 0.2;
  if (card.steal) v += card.steal * 0.25;
  if (card.draw) v += card.draw * 2.5;
  if (card.heal) v += card.heal * (state.hp < state.maxHp * 0.6 ? 1.6 : 0.3);
  if (card.energy) v += card.energy * 4;
  if (card.nextEnergy) v += card.nextEnergy * 3;
  if (card.poison) v += card.poison * 2.4;
  if (card.burn) v += card.burn * 2.4;
  if (card.weaken) v += card.weaken * (incoming > 0 ? 3 : 0.5);
  if (card.stun) v += incoming > 0 ? 7 : 2;
  if (card.selfDmg) v -= card.selfDmg * 1.5;
  if (card.suit === 'coin' && state.crew.id === 'hantu') v += 1.0;
  v += chainBonus;
  return v / (0.5 + card.cost);
}

/** Play the best card in hand once; returns true if one was played. */
export function autopilotStep(state) {
  let bestUid = null;
  let bestScore = 0.6;
  for (const entry of state.hand) {
    const score = scorePlay(state, entry.uid);
    if (score > bestScore) { bestScore = score; bestUid = entry.uid; }
  }
  if (bestUid === null) return false;
  playCard(state, bestUid);
  return true;
}

/** Play a whole fight to its end. Returns 'won' | 'lost'. */
export function autopilotFight(state) {
  let guard = 0;
  while (state.screen === 'fight' && guard < 500) {
    guard += 1;
    while (autopilotStep(state)) {
      if (state.screen !== 'fight') return state.screen === 'draft' || state.screen === 'level' || state.screen === 'win' ? 'won' : 'lost';
    }
    if (state.screen !== 'fight') break;
    endTurn(state);
  }
  if (state.screen === 'fight') return 'stuck';
  if (state.screen === 'lose') return 'lost';
  return 'won';
}

/** Draft the highest-value card on offer. */
export function autopilotDraft(state) {
  let best = state.draft[0];
  let bestValue = -1;
  for (const id of state.draft) {
    const value = cardValue(cardById(id));
    if (value > bestValue) { bestValue = value; best = id; }
  }
  chooseDraft(state, best);
}

/** Between heists: take the best relic, rest when hurt, spend spare gold in
 *  the shop, then move on. */
export function autopilotLevel(state) {
  if (!state.levelRelicTaken && state.levelRelics.length > 0) {
    let best = state.levelRelics[0];
    let bestValue = -1;
    for (const id of state.levelRelics) {
      const value = relicById(id).value;
      if (value > bestValue) { bestValue = value; best = id; }
    }
    takeRelic(state, best);
  }
  if (state.hp < state.maxHp * 0.6) shopHeal(state);
  if (state.gold >= SHOP_BUY_COST + 30) shopBuyCard(state);
  if (state.gold >= SHOP_REMOVE_COST + 20 && state.deck.length > 12) shopRemoveCard(state);
  proceedLevel(state);
}

/** Play a whole run from a seed, with the named crew. Returns { won, state }. */
export function autopilotRun(seed, crewId = 'kilat') {
  const state = createRun(seed, crewId);
  startRun(state);
  let guard = 0;
  while (state.screen !== 'win' && state.screen !== 'lose' && guard < 100) {
    guard += 1;
    if (state.screen === 'fight') {
      if (autopilotFight(state) === 'lost') break;
    } else if (state.screen === 'draft') {
      autopilotDraft(state);
    } else if (state.screen === 'level') {
      autopilotLevel(state);
    } else break;
  }
  return { won: state.screen === 'win', state };
}

/** The reckless pilot: never blocks, never heals, plays whatever damage is
 *  in hand at random, drafts at random. It exists to prove the lose path. */
export function recklessRun(seed, crewId = 'kilat') {
  const state = createRun(seed, crewId);
  startRun(state);
  let guard = 0;
  while (state.screen !== 'win' && state.screen !== 'lose' && guard < 100) {
    guard += 1;
    if (state.screen === 'fight') {
      const damaging = state.hand.filter((c) => (cardById(c.id).dmg || 0) > 0 && state.energy >= cardById(c.id).cost);
      if (damaging.length > 0) {
        const pick = damaging[state.rng.nextInt(damaging.length)];
        playCard(state, pick.uid);
        if (state.screen !== 'fight') continue;
      }
      endTurn(state);
    } else if (state.screen === 'draft') {
      chooseDraft(state, state.draft[state.rng.nextInt(state.draft.length)]);
    } else if (state.screen === 'level') {
      if (state.levelRelics.length > 0 && !state.levelRelicTaken) {
        takeRelic(state, state.levelRelics[0]);
      }
      proceedLevel(state);
    } else break;
  }
  return { won: state.screen === 'win', state };
}
