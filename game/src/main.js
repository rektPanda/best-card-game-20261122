// BRANKAS — Deck Heist. Boot and the live game: the world advances only on
// player actions, the renderer paints what is there, and the autopilot can
// take over with ?auto=1. ?shot=start|play|win|lose (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { createRun, startRun, playCard, endTurn, chooseDraft, runScore, takeRelic, shopHeal, shopBuyCard, shopRemoveCard, proceedLevel } from './world.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createSound } from './sound.js';
import { cardById } from './cards.js';
import { stageShot } from './shots.js';
import { autopilotStep, autopilotDraft, autopilotLevel } from './autopilot.js';

const BEST_KEY = 'brankas-best-gold';
const BEST_SCORE_KEY = 'brankas-best-score';
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const autoMode = params.get('auto') === '1';

const app = document.getElementById('app');
const renderer = createRenderer(app);
const sound = createSound();
const ui = { paused: false, muted: false, best: readBest(), bestScore: readBestScore(), crew: 'kilat', auto: autoMode };
let state = createRun(seed, ui.crew);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function readBestScore() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function saveBestScore(value) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch {
    // Storage can be off.
  }
}

function render() {
  renderer.render(state, ui);
}

function announce(message) {
  renderer.announce(message);
}

function finishRun() {
  if (state.screen === 'win') {
    sound.win();
    const score = runScore(state);
    if (state.gold > ui.best) { ui.best = state.gold; saveBest(ui.best); }
    if (score > ui.bestScore) { ui.bestScore = score; saveBestScore(ui.bestScore); }
    announce(`Heist berhasil! Skor ${score}, emas ${state.gold}.`);
    window.__runResult = 'win';
  } else if (state.screen === 'lose') {
    sound.lose();
    announce(`Tertangkap di heist ${state.levelIndex + 1}.`);
    window.__runResult = 'lose';
  }
}

function onPlayCard(uid) {
  if (ui.paused || state.screen !== 'fight') return;
  const entry = state.hand.find((c) => c.uid === uid);
  if (!entry) return;
  const cardEl = app.querySelector(`[data-uid="${uid}"]`);
  const rect = cardEl ? cardEl.getBoundingClientRect() : null;
  const card = cardById(entry.id);
  const result = playCard(state, uid);
  if (!result.ok) {
    if (result.reason === 'energy') announce('Energi tidak cukup.');
    render();
    return;
  }
  sound.play();
  if (rect) renderer.playGhost(card, rect);
  if (result.killed) sound.coin();
  render();
  finishRun();
}

function onEndTurn() {
  if (ui.paused || state.screen !== 'fight') return;
  sound.turn();
  endTurn(state);
  render();
  finishRun();
}

function onDraft(cardId) {
  if (state.screen !== 'draft') return;
  sound.coin();
  chooseDraft(state, cardId);
  render();
  finishRun();
}

function onLevelReward(kind) {
  if (state.screen !== 'level') return;
  sound.click();
  shopHeal(state);
  render();
}

function onTakeRelic(relicId) {
  if (state.screen !== 'level') return;
  sound.coin();
  takeRelic(state, relicId);
  render();
}

function onShopHeal() {
  if (state.screen !== 'level') return;
  sound.click();
  shopHeal(state);
  render();
}

function onShopBuy() {
  if (state.screen !== 'level') return;
  sound.coin();
  shopBuyCard(state);
  render();
}

function onShopRemove() {
  if (state.screen !== 'level') return;
  sound.click();
  shopRemoveCard(state);
  render();
}

function onProceed() {
  if (state.screen !== 'level') return;
  sound.click();
  proceedLevel(state);
  render();
}

function onCrew(crewId) {
  ui.crew = crewId;
  sound.click();
  state = createRun(seed, ui.crew);
  render();
}

function onStart() {
  sound.click();
  ui.paused = false;
  state = createRun(seed, ui.crew);
  startRun(state);
  announce('Heist 1 dimulai. Kalahkan Satpam Toko.');
  render();
}

function onRestart() {
  sound.click();
  ui.paused = false;
  state = createRun(seed, ui.crew);
  startRun(state);
  render();
}

function onTitle() {
  sound.click();
  ui.paused = false;
  state = createRun(seed, ui.crew);
  render();
}

function onPause() {
  if (state.screen !== 'fight' && state.screen !== 'draft') return;
  ui.paused = !ui.paused;
  sound.click();
  render();
}

function onMute() {
  ui.muted = sound.toggleMute();
  const btn = app.querySelector('#mute-btn');
  if (btn) btn.textContent = ui.muted ? '✕' : '♪';
}

function onConfirm() {
  if (state.screen === 'title') onStart();
  else if (state.screen === 'win' || state.screen === 'lose') onRestart();
  else if (ui.paused) onPause();
  else if (state.screen === 'fight') onEndTurn();
}

function onPlayIndex(index) {
  if (ui.paused || state.screen !== 'fight') return;
  const entry = state.hand[index];
  if (entry) onPlayCard(entry.uid);
}

createInput(app, {
  onPlayCard,
  onDraft,
  onStart,
  onRestart,
  onEndTurn,
  onPause,
  onResume: onPause,
  onTitle,
  onMute,
  onCrew,
  onTakeRelic,
  onShopHeal,
  onShopBuy,
  onShopRemove,
  onProceed,
  onConfirm,
  onPlayIndex,
});

/** In auto mode the autopilot plays one step every beat, forever. */
function autoBeat() {
  if (state.screen === 'title') { onStart(); return; }
  if (state.screen === 'fight') {
    if (!autopilotStep(state)) onEndTurn();
    else render();
    finishRun();
    return;
  }
  if (state.screen === 'draft') { autopilotDraft(state); render(); finishRun(); return; }
  if (state.screen === 'level') { autopilotLevel(state); render(); }
}

function runShot(name) {
  state = stageShot(name, seed);
  finishRun();
  let painted = 0;
  function paint() {
    render();
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  render();
  announce('Brankas. Tekan Spasi atau klik untuk mulai.');
  if (autoMode) window.setInterval(autoBeat, 250);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'fight' && !ui.paused) onPause();
  });
}

if (shot) runShot(shot);
else runGame();
