const BEST_KEY = 'skyJumpBest';
const BOMBS_KEY = 'skyJumpBombs';

// Best height reached in a normal playthrough (started from 0 m), in meters.
export function getBestHeight() {
  return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0;
}

export function setBestHeight(meters) {
  if (meters > getBestHeight()) {
    localStorage.setItem(BEST_KEY, String(meters));
    return true;
  }
  return false;
}

// Most bombs destroyed in a single run (without dying).
export function getBestBombs() {
  return parseInt(localStorage.getItem(BOMBS_KEY) || '0', 10) || 0;
}

export function setBestBombs(count) {
  if (count > getBestBombs()) {
    localStorage.setItem(BOMBS_KEY, String(count));
    return true;
  }
  return false;
}
