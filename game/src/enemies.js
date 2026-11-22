// BRANKAS — Deck Heist. The three heists and their nine opponents. Every enemy
// cycles a fixed, readable intent pattern, so its next move can be seen and
// countered: attack, block, buff, or a double hit.
export const ENEMIES = {
  'satpam': {
    id: 'satpam', name: 'Satpam Toko', title: 'Penjaga toko emas', hp: 32,
    glyph: '♟', color: '#8a94a6',
    pattern: [
      { type: 'attack', dmg: 6, label: 'Pukul 6' },
      { type: 'block', amount: 5, label: 'Siaga 5' },
      { type: 'attack', dmg: 8, label: 'Pukul 8' },
    ],
  },
  'anjing': {
    id: 'anjing', name: 'Anjing Penjaga', title: 'Ganas dan cepat', hp: 36,
    glyph: '♞', color: '#b08954',
    pattern: [
      { type: 'attack', dmg: 7, label: 'Gigit 7' },
      { type: 'double', dmg: 5, label: 'Serang 5 ×2' },
      { type: 'buff', amount: 3, label: 'Menggeram +3' },
    ],
  },
  'pemilik': {
    id: 'pemilik', name: 'Pemilik Toko', title: 'BOS — Toko Emas', hp: 54,
    glyph: '♛', color: '#ffc93c',
    power: 'Kuasa bos: tiap bersiaga, +2 serang.',
    pattern: [
      { type: 'attack', dmg: 10, label: 'Tongkat 10' },
      { type: 'block', amount: 8, label: 'Siaga 8' },
      { type: 'attack', dmg: 12, label: 'Tongkat 12' },
      { type: 'buff', amount: 3, label: 'Teriak +3' },
    ],
  },
  'dealer': {
    id: 'dealer', name: 'Dealer Licik', title: 'Tangan cepat kasino', hp: 44,
    glyph: '♠', color: '#c084fc',
    pattern: [
      { type: 'attack', dmg: 8, label: 'Lempar 8' },
      { type: 'block', amount: 6, label: 'Siaga 6' },
      { type: 'attack', dmg: 9, label: 'Lempar 9' },
    ],
  },
  'bodyguard': {
    id: 'bodyguard', name: 'Bodyguard', title: 'Dinding manusia', hp: 52,
    glyph: '♜', color: '#94a3b8',
    pattern: [
      { type: 'attack', dmg: 11, label: 'Tahan 11' },
      { type: 'block', amount: 10, label: 'Siaga 10' },
      { type: 'attack', dmg: 13, label: 'Banting 13' },
    ],
  },
  'bos-kasino': {
    id: 'bos-kasino', name: 'Bos Kasino', title: 'BOS — Kasino', hp: 66,
    glyph: '♚', color: '#ff5a3c',
    power: 'Kuasa bos: tiap menyerang, mencuri 5 emas.',
    pattern: [
      { type: 'attack', dmg: 12, label: 'Pukul 12' },
      { type: 'block', amount: 10, label: 'Siaga 10' },
      { type: 'attack', dmg: 15, label: 'Pukul 15' },
      { type: 'buff', amount: 4, label: 'Marah +4' },
    ],
  },
  'penjaga-malam': {
    id: 'penjaga-malam', name: 'Penjaga Malam', title: 'Patroli museum', hp: 54,
    glyph: '☾', color: '#7dd3fc',
    pattern: [
      { type: 'attack', dmg: 12, label: 'Senter 12' },
      { type: 'block', amount: 8, label: 'Siaga 8' },
      { type: 'attack', dmg: 14, label: 'Senter 14' },
    ],
  },
  'laser': {
    id: 'laser', name: 'Laser Sentry', title: 'Menara laser otomatis', hp: 58,
    glyph: '✦', color: '#f472b6',
    pattern: [
      { type: 'attack', dmg: 14, label: 'Laser 14' },
      { type: 'block', amount: 12, label: 'Perisai 12' },
      { type: 'double', dmg: 10, label: 'Laser 10 ×2' },
    ],
  },
  'direktur': {
    id: 'direktur', name: 'Direktur Museum', title: 'BOS AKHIR — Museum Berlian', hp: 78,
    glyph: '★', color: '#fbbf24',
    power: 'Kuasa bos: tiap menguat, +10 blok.',
    pattern: [
      { type: 'attack', dmg: 13, label: 'Perintah 13' },
      { type: 'block', amount: 14, label: 'Siaga 14' },
      { type: 'attack', dmg: 16, label: 'Perintah 16' },
      { type: 'buff', amount: 5, label: 'Murka +5' },
      { type: 'attack', dmg: 18, label: 'Perintah 18' },
    ],
  },
};

export const LEVELS = [
  {
    name: 'HEIST 1 — TOKO EMAS',
    sub: 'Masuk lewat pintu belakang, ambil emasnya, jangan bangunkan anjingnya.',
    enemies: ['satpam', 'anjing', 'pemilik'],
    reward: 18,
  },
  {
    name: 'HEIST 2 — KASINO',
    sub: 'Meja judi penuh uang. Dealer sudah curiga — main cepat, main bersih.',
    enemies: ['dealer', 'bodyguard', 'bos-kasino'],
    reward: 26,
  },
  {
    name: 'HEIST 3 — MUSEUM BERLIAN',
    sub: 'Berlian terbesar di kota, dijaga laser dan direktur yang tak kenal ampun.',
    enemies: ['penjaga-malam', 'laser', 'direktur'],
    reward: 36,
  },
];

export function enemyById(id) {
  return ENEMIES[id];
}
