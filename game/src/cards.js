// BRANKAS — Deck Heist. The card catalogue: 44 unique cards across the four
// suits. Every card is data: name, suit, cost and effect fields. world.js
// reads the fields and applies them; render.js reads them to print the text.
//
// Effect fields (all optional, 0 when absent):
//   dmg        damage to the enemy (before chain bonus)
//   hits       how many times dmg lands (default 1)
//   block      shield for the player this turn
//   gold       gold looted at once
//   steal      gold stolen from the enemy's stash
//   draw       cards drawn
//   heal       HP restored
//   energy     energy gained this turn
//   nextEnergy energy gained next turn
//   poison     poison stacks on the enemy (ticks at its turn)
//   burn       burn stacks on the enemy (ticks at its turn)
//   weaken     enemy deals this much less damage (stacks, fades slowly)
//   stun       enemy skips its next action
//   selfDmg    damage the player takes for playing it
//   comboDmg   extra damage when the chain is 2 or more
//   comboGold  extra gold when the chain is 2 or more
//   execute    extra damage when the enemy is below half HP
export const CARDS = [
  // ---- BERLIAN ◆ : damage, sharp and fast ----
  { id: 'silet', name: 'Silet', suit: 'diamond', cost: 1, dmg: 6 },
  { id: 'tusuk-cepat', name: 'Tusuk Cepat', suit: 'diamond', cost: 0, dmg: 3 },
  { id: 'tebasan', name: 'Tebasan', suit: 'diamond', cost: 2, dmg: 11 },
  { id: 'hujan-pisau', name: 'Hujan Pisau', suit: 'diamond', cost: 2, dmg: 4, hits: 2 },
  { id: 'belati-racun', name: 'Belati Racun', suit: 'diamond', cost: 1, dmg: 4, poison: 3 },
  { id: 'serang-balik', name: 'Serang Balik', suit: 'diamond', cost: 1, dmg: 5, block: 4 },
  { id: 'tusuk-jantung', name: 'Tusuk Jantung', suit: 'diamond', cost: 3, dmg: 18 },
  { id: 'badai-baja', name: 'Badai Baja', suit: 'diamond', cost: 2, dmg: 3, hits: 3 },
  { id: 'potong-rantai', name: 'Potong Rantai', suit: 'diamond', cost: 1, dmg: 4, comboDmg: 5 },
  { id: 'eksekusi', name: 'Eksekusi', suit: 'diamond', cost: 2, dmg: 10, execute: 6 },
  { id: 'sayat', name: 'Sayat', suit: 'diamond', cost: 0, dmg: 2, draw: 1 },
  // ---- API ▲ : damage over time, burn ----
  { id: 'bakar', name: 'Bakar', suit: 'flame', cost: 1, dmg: 4, burn: 4 },
  { id: 'molotov', name: 'Molotov', suit: 'flame', cost: 2, dmg: 8, burn: 3 },
  { id: 'ledakan', name: 'Ledakan', suit: 'flame', cost: 3, dmg: 16 },
  { id: 'percikan', name: 'Percikan', suit: 'flame', cost: 0, dmg: 2, burn: 2 },
  { id: 'bara', name: 'Bara', suit: 'flame', cost: 1, dmg: 3, burn: 5 },
  { id: 'kobaran', name: 'Kobaran', suit: 'flame', cost: 2, dmg: 6, burn: 3, comboDmg: 4 },
  { id: 'asap-tebal', name: 'Asap Tebal', suit: 'flame', cost: 1, block: 8, weaken: 2 },
  { id: 'sumbu-pendek', name: 'Sumbu Pendek', suit: 'flame', cost: 1, dmg: 9, selfDmg: 2 },
  { id: 'inferno', name: 'Inferno', suit: 'flame', cost: 3, dmg: 12, burn: 8 },
  { id: 'obor', name: 'Obor', suit: 'flame', cost: 1, dmg: 5, draw: 1 },
  { id: 'pijar', name: 'Pijar', suit: 'flame', cost: 0, burn: 3 },
  // ---- KOIN ● : gold, theft, trickery ----
  { id: 'curi-dompet', name: 'Curi Dompet', suit: 'coin', cost: 1, dmg: 3, steal: 6 },
  { id: 'rampas', name: 'Rampas', suit: 'coin', cost: 2, dmg: 7, steal: 10 },
  { id: 'kantong-ajaib', name: 'Kantong Ajaib', suit: 'coin', cost: 1, gold: 12 },
  { id: 'suap', name: 'Suap', suit: 'coin', cost: 2, stun: 1 },
  { id: 'koin-beruntung', name: 'Koin Beruntung', suit: 'coin', cost: 0, gold: 5, draw: 1 },
  { id: 'jual-barang', name: 'Jual Barang', suit: 'coin', cost: 1, gold: 8, heal: 2 },
  { id: 'brankas-kecil', name: 'Brankas Kecil', suit: 'coin', cost: 2, block: 10, gold: 6 },
  { id: 'tipu', name: 'Tipu', suit: 'coin', cost: 1, dmg: 4, steal: 8, comboGold: 8 },
  { id: 'emas-batangan', name: 'Emas Batangan', suit: 'coin', cost: 3, gold: 25 },
  { id: 'pencopet', name: 'Pencopet', suit: 'coin', cost: 0, steal: 4 },
  { id: 'investasi', name: 'Investasi', suit: 'coin', cost: 2, gold: 15, nextEnergy: 1 },
  // ---- BRANKAS ■ : defence, draw, control ----
  { id: 'perisai', name: 'Perisai', suit: 'vault', cost: 1, block: 7 },
  { id: 'tembok', name: 'Tembok', suit: 'vault', cost: 2, block: 13 },
  { id: 'kunci-ganda', name: 'Kunci Ganda', suit: 'vault', cost: 1, block: 5, draw: 1 },
  { id: 'sembunyi', name: 'Sembunyi', suit: 'vault', cost: 0, block: 4 },
  { id: 'tameng-baja', name: 'Tameng Baja', suit: 'vault', cost: 2, block: 10, heal: 3 },
  { id: 'rencana-cadangan', name: 'Rencana Cadangan', suit: 'vault', cost: 1, draw: 2 },
  { id: 'mata-mata', name: 'Mata-mata', suit: 'vault', cost: 1, draw: 2, gold: 4 },
  { id: 'peta-brankas', name: 'Peta Brankas', suit: 'vault', cost: 0, draw: 1, energy: 1 },
  { id: 'gembok', name: 'Gembok', suit: 'vault', cost: 2, block: 8, weaken: 3 },
  { id: 'jalan-keluar', name: 'Jalan Keluar', suit: 'vault', cost: 1, heal: 6 },
  { id: 'sandera', name: 'Sandera', suit: 'vault', cost: 2, dmg: 6, stun: 1 },
  { id: 'selimut', name: 'Selimut', suit: 'vault', cost: 1, block: 6, heal: 2 },
];

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

export function cardById(id) {
  return BY_ID.get(id);
}

export const STARTER_DECK = [
  'silet', 'silet', 'tusuk-cepat', 'tebasan', 'perisai', 'tembok',
  'curi-dompet', 'bakar', 'rencana-cadangan', 'kunci-ganda',
];

/** Three distinct draft choices, never a card already in the deck twice. */
export function draftChoices(rng, deck, count = 3) {
  const pool = CARDS.filter((c) => deck.filter((d) => d === c.id).length < 2);
  const shuffled = rng.shuffle(pool);
  return shuffled.slice(0, count).map((c) => c.id);
}

/** One-line effect text for a card face, in Indonesian. */
export function describeCard(card) {
  const parts = [];
  if (card.dmg) parts.push(`Serang ${card.dmg}${card.hits > 1 ? ` ×${card.hits}` : ''}`);
  if (card.block) parts.push(`Blok ${card.block}`);
  if (card.gold) parts.push(`+${card.gold} emas`);
  if (card.steal) parts.push(`Curi ${card.steal} emas`);
  if (card.draw) parts.push(`Ambil ${card.draw} kartu`);
  if (card.heal) parts.push(`Pulih ${card.heal} HP`);
  if (card.energy) parts.push(`+${card.energy} energi`);
  if (card.nextEnergy) parts.push(`+${card.nextEnergy} energi giliran depan`);
  if (card.poison) parts.push(`Racun ${card.poison}`);
  if (card.burn) parts.push(`Bakar ${card.burn}`);
  if (card.weaken) parts.push(`Lemahkan ${card.weaken}`);
  if (card.stun) parts.push('Musuh diam 1 giliran');
  if (card.selfDmg) parts.push(`Kena ${card.selfDmg} sendiri`);
  if (card.comboDmg) parts.push(`Rantai 2+: +${card.comboDmg} serang`);
  if (card.comboGold) parts.push(`Rantai 2+: +${card.comboGold} emas`);
  if (card.execute) parts.push(`Musuh <½ HP: +${card.execute}`);
  return parts.join(' · ') || '—';
}

/** Rough value of a card for the autopilot's draft pick. */
export function cardValue(card) {
  let v = 0;
  v += (card.dmg || 0) * (card.hits || 1) * 1.0;
  v += (card.block || 0) * 0.9;
  v += (card.gold || 0) * 0.35 + (card.steal || 0) * 0.4;
  v += (card.draw || 0) * 3.0;
  v += (card.heal || 0) * 0.8;
  v += (card.energy || 0) * 5 + (card.nextEnergy || 0) * 4;
  v += (card.poison || 0) * 2.2 + (card.burn || 0) * 2.2;
  v += (card.weaken || 0) * 2.5;
  v += (card.stun || 0) * 7;
  v += (card.comboDmg || 0) * 0.8 + (card.comboGold || 0) * 0.25;
  v += (card.execute || 0) * 0.5;
  v -= (card.selfDmg || 0) * 1.5;
  return v / (0.5 + card.cost);
}

// ---- KRU (factions): three starting crews, each its own starter deck and passive ----
export const CREWS = [
  {
    id: 'kilat', name: 'KRU KILAT', glyph: '♘', color: '#f5c542',
    desc: 'Cepat dan gesit: +1 energi di giliran pertama tiap pertarungan.',
    starter: ['tusuk-cepat', 'sayat', 'percikan', 'curi-dompet', 'perisai', 'peta-brankas', 'silet', 'bakar', 'koin-beruntung', 'rencana-cadangan'],
  },
  {
    id: 'besi', name: 'KRU BESI', glyph: '♖', color: '#7dd3fc',
    desc: 'Tahan banting: mulai tiap pertarungan dengan 6 blok.',
    starter: ['perisai', 'tembok', 'tameng-baja', 'kunci-ganda', 'gembok', 'selimut', 'tebasan', 'serang-balik', 'jalan-keluar', 'silet'],
  },
  {
    id: 'hantu', name: 'KRU HANTU', glyph: '☠', color: '#c084fc',
    desc: 'Tangan licin: tiap kartu KOIN memberi +4 emas dan +1 serang.',
    starter: ['curi-dompet', 'rampas', 'tipu', 'koin-beruntung', 'tebasan', 'bakar', 'belati-racun', 'molotov', 'silet', 'peta-brankas'],
  },
];

export function crewById(id) {
  return CREWS.find((c) => c.id === id) || CREWS[0];
}

// ---- RELIK: passive artifacts, one offered after each boss ----
export const RELICS = [
  { id: 'topeng-emas', name: 'Topeng Emas', desc: '+8 HP maks & pulih 8 HP sekarang.', value: 9 },
  { id: 'sarung-tangan', name: 'Sarung Tangan Sutra', desc: '+1 energi di giliran pertama tiap pertarungan.', value: 8 },
  { id: 'sepatu-senyap', name: 'Sepatu Senyap', desc: 'Mulai tiap pertarungan dengan 5 blok.', value: 7 },
  { id: 'kantong-dalam', name: 'Kantong Dalam', desc: '+10 emas tiap menang pertarungan.', value: 7 },
  { id: 'lensa', name: 'Lensa Pengintai', desc: 'Ambil 1 kartu ekstra di giliran pertama.', value: 6 },
  { id: 'jimat', name: 'Jimat Keberuntungan', desc: 'Pulih 3 HP tiap menang pertarungan.', value: 6 },
];

export function relicById(id) {
  return RELICS.find((r) => r.id === id);
}

/** Two distinct relic offers, never one the crew already owns. */
export function relicChoices(rng, owned, count = 2) {
  const pool = RELICS.filter((r) => !owned.includes(r.id));
  return rng.shuffle(pool).slice(0, count).map((r) => r.id);
}
