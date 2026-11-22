// BRANKAS — Deck Heist. The rules: one run, three heists, nine fights. Pure
// logic, no DOM: the same module drives the browser game, the autopilot and
// the screenshot scenes, so every frame you see is the real game.
//
// Systems in one run: 3 crews (factions) with their own starter deck and
// passive; 44 cards in 4 suits; RANTAI (same-suit chain) and SILANG
// (cross-suit, +1 energy once a turn); a draft after every fight; 6 relics
// offered after each boss; a shop between heists (heal, buy a card, remove
// a card); 9 enemies with fixed readable intents, and a unique power on
// each of the 3 bosses; a score of gold + fights + surviving HP.
import {
  PLAYER_MAX_HP, ENERGY_PER_TURN, HAND_SIZE, MAX_HAND,
  DRAFT_CHOICES, LEVEL_HEAL,
} from './config.js';
import { createRandom } from './random.js';
import { cardById, cardValue, crewById, relicById, relicChoices, draftChoices, CARDS } from './cards.js';
import { LEVELS, enemyById } from './enemies.js';

export const SHOP_BUY_COST = 20;
export const SHOP_REMOVE_COST = 25;
export const MIN_DECK = 10;

export function createRun(seed, crewId = 'kilat') {
  return {
    seed,
    rng: createRandom(seed),
    crew: crewById(crewId),
    screen: 'title',
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    gold: 0,
    deck: crewById(crewId).starter.slice(),
    drawPile: [],
    discardPile: [],
    hand: [],
    uidCounter: 1,
    levelIndex: 0,
    fightIndex: 0,
    enemy: null,
    turn: 0,
    energy: 0,
    block: 0,
    chainSuit: null,
    chainCount: 0,
    crossUsed: false,
    nextEnergy: 0,
    relics: [],
    draft: [],
    levelRelics: [],
    levelRelicTaken: false,
    levelHealed: false,
    pendingLevelEnd: false,
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, goldStolen: 0, fightsWon: 0, goldEarned: 0 },
    log: [],
  };
}

export function hasRelic(state, id) {
  return state.relics.includes(id);
}

function log(state, text) {
  state.log.push(text);
  if (state.log.length > 4) state.log.shift();
}

export function currentIntent(state) {
  if (!state.enemy) return null;
  return state.enemy.pattern[state.enemy.intentIndex % state.enemy.pattern.length];
}

export function incomingDamage(state) {
  const intent = currentIntent(state);
  if (!intent) return 0;
  if (intent.type === 'attack') return Math.max(0, intent.dmg + state.enemy.buff - state.enemy.weaken);
  if (intent.type === 'double') return Math.max(0, intent.dmg + state.enemy.buff - state.enemy.weaken) * 2;
  return 0;
}

export function startRun(state) {
  state.hp = PLAYER_MAX_HP;
  state.maxHp = PLAYER_MAX_HP;
  state.gold = 0;
  state.deck = state.crew.starter.slice();
  state.relics = [];
  state.levelIndex = 0;
  state.fightIndex = 0;
  state.pendingLevelEnd = false;
  state.stats = { turns: 0, cardsPlayed: 0, damageDealt: 0, goldStolen: 0, fightsWon: 0, goldEarned: 0 };
  state.log = [];
  startFight(state);
}

export function startFight(state) {
  const level = LEVELS[state.levelIndex];
  const def = enemyById(level.enemies[state.fightIndex]);
  // Seeded variation: the same seed always meets the same guard, slightly
  // stronger or weaker than the book value.
  const hp = Math.max(8, Math.round(def.hp * (0.9 + state.rng.next() * 0.2)));
  state.enemy = {
    id: def.id, name: def.name, title: def.title, glyph: def.glyph, color: def.color,
    power: def.power || null,
    hp, maxHp: hp, pattern: def.pattern,
    block: 0, buff: 0, poison: 0, burn: 0, weaken: 0, stunned: 0, intentIndex: 0,
  };
  state.drawPile = state.rng.shuffle(state.deck);
  state.discardPile = [];
  state.hand = [];
  state.turn = 1;
  state.energy = ENERGY_PER_TURN
    + (state.crew.id === 'kilat' ? 1 : 0)
    + (hasRelic(state, 'sarung-tangan') ? 1 : 0);
  state.block = (state.crew.id === 'besi' ? 6 : 0) + (hasRelic(state, 'sepatu-senyap') ? 5 : 0);
  state.chainSuit = null;
  state.chainCount = 0;
  state.crossUsed = false;
  state.nextEnergy = 0;
  state.screen = 'fight';
  log(state, `${def.name} menghadang!`);
  drawCards(state, HAND_SIZE + (hasRelic(state, 'lensa') ? 1 : 0));
}

export function drawCards(state, count) {
  for (let i = 0; i < count; i += 1) {
    if (state.hand.length >= MAX_HAND) break;
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) break;
      state.drawPile = state.rng.shuffle(state.discardPile);
      state.discardPile = [];
    }
    const id = state.drawPile.pop();
    state.hand.push({ uid: state.uidCounter, id });
    state.uidCounter += 1;
  }
}

function damageEnemy(state, amount) {
  let rest = amount;
  if (state.enemy.block > 0) {
    const absorbed = Math.min(state.enemy.block, rest);
    state.enemy.block -= absorbed;
    rest -= absorbed;
  }
  state.enemy.hp -= rest;
  state.stats.damageDealt += rest;
  return rest;
}

function winFight(state) {
  const level = LEVELS[state.levelIndex];
  let reward = level.reward + state.rng.nextInt(9);
  if (hasRelic(state, 'kantong-dalam')) reward += 10;
  state.gold += reward;
  state.stats.goldEarned += reward;
  state.stats.fightsWon += 1;
  if (hasRelic(state, 'jimat')) state.hp = Math.min(state.maxHp, state.hp + 3);
  state.pendingLevelEnd = state.fightIndex === level.enemies.length - 1;
  log(state, `${state.enemy.name} kalah! +${reward} emas.`);
  state.enemy = null;
  state.hand = [];
  state.draft = draftChoices(state.rng, state.deck, DRAFT_CHOICES);
  if (state.pendingLevelEnd) state.levelRelics = relicChoices(state.rng, state.relics, 2);
  state.screen = 'draft';
}

/** Play one card from the hand. Returns { ok, reason? }. */
export function playCard(state, uid) {
  if (state.screen !== 'fight' || !state.enemy) return { ok: false, reason: 'not-fighting' };
  const index = state.hand.findIndex((c) => c.uid === uid);
  if (index === -1) return { ok: false, reason: 'no-card' };
  const card = cardById(state.hand[index].id);
  if (state.energy < card.cost) return { ok: false, reason: 'energy' };
  state.hand.splice(index, 1);
  state.discardPile.push(card.id);
  state.energy -= card.cost;
  state.stats.cardsPlayed += 1;

  // SILANG: a different suit right after another suit pays +1 energy, once
  // a turn — the reward for mixing suits instead of chaining one.
  const prevSuit = state.chainSuit;
  if (prevSuit && prevSuit !== card.suit && !state.crossUsed) {
    state.energy += 1;
    state.crossUsed = true;
    log(state, 'SILANG! +1 energi.');
  }
  // RANTAI: consecutive cards of the same suit in one turn chain up (capped).
  if (state.chainSuit === card.suit) state.chainCount += 1;
  else { state.chainSuit = card.suit; state.chainCount = 1; }
  const bonus = Math.min(state.chainCount - 1, 3);

  if (card.dmg) {
    let perHit = card.dmg + bonus;
    if (card.suit === 'coin' && state.crew.id === 'hantu') perHit += 1;
    if (card.comboDmg && state.chainCount >= 2) perHit += card.comboDmg;
    if (card.execute && state.enemy.hp <= state.enemy.maxHp / 2) perHit += card.execute;
    for (let h = 0; h < (card.hits || 1); h += 1) damageEnemy(state, perHit);
  }
  if (card.block) state.block += card.block + bonus;
  if (card.gold) state.gold += card.gold;
  if (card.comboGold && state.chainCount >= 2) state.gold += card.comboGold;
  if (card.steal) { state.gold += card.steal; state.stats.goldStolen += card.steal; }
  if (card.suit === 'coin' && state.crew.id === 'hantu') state.gold += 4;
  if (card.draw) drawCards(state, card.draw);
  if (card.heal) state.hp = Math.min(state.maxHp, state.hp + card.heal);
  if (card.energy) state.energy += card.energy;
  if (card.nextEnergy) state.nextEnergy += card.nextEnergy;
  if (card.poison) state.enemy.poison += card.poison;
  if (card.burn) state.enemy.burn += card.burn;
  if (card.weaken) state.enemy.weaken += card.weaken;
  if (card.stun) state.enemy.stunned = 1;
  if (card.selfDmg) state.hp -= card.selfDmg;

  log(state, `${card.name} dimainkan${state.chainCount >= 2 ? ` — RANTAI x${state.chainCount}!` : ''}`);
  if (state.enemy.hp <= 0) { winFight(state); return { ok: true, killed: true }; }
  if (state.hp <= 0) { state.screen = 'lose'; log(state, 'Kru tumbang karena ulahnya sendiri.'); }
  return { ok: true };
}

/** End the player's turn: the enemy acts, dots tick, a new turn begins. */
export function endTurn(state) {
  if (state.screen !== 'fight' || !state.enemy) return;
  const enemy = state.enemy;
  enemy.block = 0;
  const intent = currentIntent(state);
  if (enemy.stunned) {
    enemy.stunned = 0;
    log(state, `${enemy.name} diam terpaku!`);
  } else if (intent.type === 'attack' || intent.type === 'double') {
    const hits = intent.type === 'double' ? 2 : 1;
    const perHit = Math.max(0, intent.dmg + enemy.buff - enemy.weaken);
    let total = 0;
    for (let h = 0; h < hits; h += 1) {
      const absorbed = Math.min(state.block, perHit);
      state.block -= absorbed;
      total += perHit - absorbed;
    }
    state.hp -= total;
    log(state, `${enemy.name} menyerang ${total} damage.`);
    // Kuasa bos: Bos Kasino mencuri emas tiap kali menyerang.
    if (enemy.id === 'bos-kasino' && state.gold > 0) {
      const stolen = Math.min(5, state.gold);
      state.gold -= stolen;
      log(state, `Bos Kasino mencuri ${stolen} emas!`);
    }
  } else if (intent.type === 'block') {
    enemy.block += intent.amount;
    log(state, `${enemy.name} bersiaga (+${intent.amount} blok).`);
    // Kuasa bos: Pemilik Toko menguat tiap kali bersiaga.
    if (enemy.id === 'pemilik') {
      enemy.buff += 2;
      log(state, 'Pemilik Toko menguat (+2 serang).');
    }
  } else if (intent.type === 'buff') {
    enemy.buff += intent.amount;
    log(state, `${enemy.name} menguat (+${intent.amount} serang).`);
    // Kuasa bos: Direktur memanggil pengawal tiap kali menguat.
    if (enemy.id === 'direktur') {
      enemy.block += 10;
      log(state, 'Direktur memanggil pengawal (+10 blok).');
    }
  }
  enemy.intentIndex += 1;

  // Damage over time ticks on the enemy.
  const dots = enemy.poison + enemy.burn;
  if (dots > 0) {
    damageEnemy(state, dots);
    log(state, `${enemy.name} menderita ${dots} (racun/bakar).`);
    enemy.poison = Math.max(0, enemy.poison - 1);
    enemy.burn = Math.max(0, enemy.burn - 1);
  }
  enemy.weaken = Math.max(0, enemy.weaken - 1);

  if (state.hp <= 0) { state.screen = 'lose'; log(state, 'Kru tertangkap!'); return; }
  if (enemy.hp <= 0) { winFight(state); return; }

  // New player turn.
  state.turn += 1;
  state.stats.turns += 1;
  state.block = 0;
  state.energy = ENERGY_PER_TURN + state.nextEnergy;
  state.nextEnergy = 0;
  state.chainSuit = null;
  state.chainCount = 0;
  state.crossUsed = false;
  drawCards(state, HAND_SIZE);
}

/** Take one of the three draft cards after a fight. */
export function chooseDraft(state, cardId) {
  if (state.screen !== 'draft') return;
  if (!state.draft.includes(cardId)) return;
  state.deck.push(cardId);
  state.draft = [];
  if (state.pendingLevelEnd) {
    state.pendingLevelEnd = false;
    if (state.levelIndex >= LEVELS.length - 1) {
      state.screen = 'win';
      log(state, 'Semua heist berhasil!');
    } else {
      state.screen = 'level';
      state.levelRelicTaken = false;
      state.levelHealed = false;
    }
    return;
  }
  state.fightIndex += 1;
  startFight(state);
}

/** After a boss: take one of the two relics on offer. */
export function takeRelic(state, relicId) {
  if (state.screen !== 'level' || state.levelRelicTaken) return;
  if (!state.levelRelics.includes(relicId)) return;
  const relic = relicById(relicId);
  state.relics.push(relicId);
  state.levelRelicTaken = true;
  if (relicId === 'topeng-emas') {
    state.maxHp += 8;
    state.hp = Math.min(state.maxHp, state.hp + 8);
  }
  log(state, `Relik didapat: ${relic.name}.`);
}

/** Shop between heists: rest once for free. */
export function shopHeal(state) {
  if (state.screen !== 'level' || state.levelHealed) return;
  state.hp = Math.min(state.maxHp, state.hp + LEVEL_HEAL);
  state.levelHealed = true;
  log(state, `Istirahat: +${LEVEL_HEAL} HP.`);
}

/** Shop between heists: buy a random card for gold. */
export function shopBuyCard(state) {
  if (state.screen !== 'level' || state.gold < SHOP_BUY_COST) return;
  const pool = CARDS.filter((c) => state.deck.filter((d) => d === c.id).length < 2);
  const card = state.rng.pick(pool);
  state.gold -= SHOP_BUY_COST;
  state.deck.push(card.id);
  log(state, `Dibeli di pasar gelap: ${card.name} (-${SHOP_BUY_COST} emas).`);
  return card.id;
}

/** Shop between heists: remove the weakest card from the deck. */
export function shopRemoveCard(state) {
  if (state.screen !== 'level' || state.gold < SHOP_REMOVE_COST) return;
  if (state.deck.length <= MIN_DECK) return;
  let worst = state.deck[0];
  let worstValue = cardValue(cardById(worst));
  for (const id of state.deck) {
    const value = cardValue(cardById(id));
    if (value < worstValue) { worstValue = value; worst = id; }
  }
  state.gold -= SHOP_REMOVE_COST;
  state.deck.splice(state.deck.indexOf(worst), 1);
  log(state, `Dibuang dari deck: ${cardById(worst).name} (-${SHOP_REMOVE_COST} emas).`);
  return worst;
}

/** Leave the hideout: next heist. */
export function proceedLevel(state) {
  if (state.screen !== 'level') return;
  state.levelIndex += 1;
  state.fightIndex = 0;
  startFight(state);
}

export function levelName(state) {
  return LEVELS[state.levelIndex].name;
}

export function isBossFight(state) {
  return state.fightIndex === LEVELS[state.levelIndex].enemies.length - 1;
}

/** Final score: looted gold + 10 per fight won + 2 per HP left standing. */
export function runScore(state) {
  return state.gold + state.stats.fightsWon * 10 + Math.max(0, state.hp) * 2;
}
