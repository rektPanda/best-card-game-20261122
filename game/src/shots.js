// BRANKAS — Deck Heist. The screenshot scenes behind ?shot=start|play|win|lose.
// Each one plays the real rules forward from a fresh run for a fixed seed, so
// the frame is what a real game looks like and the same seed always gives the
// same frame. The win scene uses the autopilot, the lose scene the reckless
// pilot that never blocks.
import { createRun, startRun } from './world.js';
import {
  autopilotRun, autopilotFight, autopilotDraft, autopilotLevel,
  autopilotStep, recklessRun,
} from './autopilot.js';
import { endTurn } from './world.js';

/** Drive a fresh run until it reaches the given level/fight, still fighting. */
function advanceTo(state, levelIndex, fightIndex) {
  let guard = 0;
  while (guard < 200) {
    guard += 1;
    if (state.screen === 'fight') {
      if (state.levelIndex === levelIndex && state.fightIndex === fightIndex) return true;
      if (autopilotFight(state) === 'lost') return false;
    } else if (state.screen === 'draft') autopilotDraft(state);
    else if (state.screen === 'level') autopilotLevel(state);
    else return false;
  }
  return false;
}

/**
 * Stage the named scene and return the run state to render. Any unknown name
 * is the title screen.
 */
export function stageShot(name, seed) {
  if (name === 'play') {
    const state = createRun(seed);
    startRun(state);
    if (advanceTo(state, 1, 0)) {
      // A live mid-fight frame: play two cards, take the enemy's hit, play one
      // more, and stop with a full hand and a visible intent.
      autopilotStep(state);
      autopilotStep(state);
      if (state.screen === 'fight') endTurn(state);
      if (state.screen === 'fight') autopilotStep(state);
      return state;
    }
    return state;
  }
  if (name === 'win') {
    return autopilotRun(seed).state;
  }
  if (name === 'lose') {
    return recklessRun(seed).state;
  }
  const state = createRun(seed);
  return state;
}
