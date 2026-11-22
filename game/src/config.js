// BRANKAS — Deck Heist. Constants and the four suits. Suits are told apart by
// shape AND colour, never by text alone: each has its own glyph and palette.
export const SUITS = {
  diamond: { key: 'diamond', name: 'BERLIAN', glyph: '◆', color: '#35d0ff', dark: '#0b4a63', text: '#bfefff' },
  flame: { key: 'flame', name: 'API', glyph: '▲', color: '#ff5a3c', dark: '#6e1d0e', text: '#ffd2c7' },
  coin: { key: 'coin', name: 'KOIN', glyph: '●', color: '#ffc93c', dark: '#6e5200', text: '#fff0bf' },
  vault: { key: 'vault', name: 'BRANKAS', glyph: '■', color: '#4ade80', dark: '#14532d', text: '#c9f7d6' },
};
export const SUIT_KEYS = ['diamond', 'flame', 'coin', 'vault'];

export const PLAYER_MAX_HP = 48;
export const ENERGY_PER_TURN = 3;
export const HAND_SIZE = 5;
export const MAX_HAND = 10;
export const DRAFT_CHOICES = 3;
export const LEVEL_HEAL = 10;
export const LEVEL_GOLD = 30;

export const APP_TITLE = 'BRANKAS';
export const APP_SUBTITLE = 'Deck Heist — Roguelike Kartu Perampokan';
