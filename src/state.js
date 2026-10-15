import { readProgress } from './database.js';

export const STORAGE_KEY = 'aguaApp';
export const POINTS_PER_DAY = 10;

export function calendarKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayNumber(key) {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function validDay(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(`${key}T12:00:00`);
  return Number.isFinite(date.getTime()) && calendarKey(date) === key && key <= calendarKey();
}

export function rewardGoal(state) {
  if (state.totalMl < state.metaLitros * 1000) return state;
  const date = new Date(state.data);
  if (!Number.isFinite(date.getTime())) return state;
  const key = calendarKey(date);
  if (!validDay(key) || state.completedDays.includes(key)) return state;
  return { ...state, completedDays: [...state.completedDays, key].sort() };
}

export function achievements(state) {
  const completed = new Set(state.completedDays);
  const current = calendarKey();
  let day = dayNumber(current);
  const numbers = new Set([...completed].map(dayNumber));
  if (!numbers.has(day)) day -= 1;
  let streak = 0;
  while (numbers.has(day)) { streak += 1; day -= 1; }
  return { points: completed.size * POINTS_PER_DAY, streak, earnedToday: completed.has(current) };
}

export function today() {
  return new Date().toDateString();
}

export function newState() {
  return { entries: [], garrafas: 0, totalMl: 0, container: 'bottle', mlCopo: 250, mlGarrafa: 500, metaLitros: 2, data: today(), completedDays: [], startedOn: calendarKey() };
}

// Hundredths of a milliliter are stored as integer units during arithmetic.
export function volumeUnits(value) {
  return Math.round(Number(value) * 100);
}

export function validVolume(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0.01 && number <= 1_000_000
    && Math.abs(number * 100 - volumeUnits(number)) < 0.000001;
}

export function remainingWater(state) {
  const current = currentDay(state);
  const units = Math.max(volumeUnits(current.metaLitros * 1000) - volumeUnits(current.totalMl), 0);
  return { ml: units / 100, bottles: Math.ceil(units / volumeUnits(current.mlGarrafa)),
    glasses: Math.ceil(units / volumeUnits(current.mlCopo)) };
}

export function selectedVolume(state) {
  return state.container === 'glass' ? state.mlCopo : state.mlGarrafa;
}

export function addWater(state, amount = selectedVolume(state), container = state.container ?? 'bottle') {
  const current = currentDay(state);
  if (!validVolume(amount) || !['bottle', 'glass', 'custom'].includes(container)) return current;
  const units = volumeUnits(current.totalMl) + volumeUnits(amount);
  if (!Number.isSafeInteger(units)) return current;
  const entry = { amountMl: volumeUnits(amount) / 100, container };
  return rewardGoal({ ...current, entries: [...(current.entries ?? []), entry],
    garrafas: current.garrafas + 1, totalMl: units / 100 });
}

export function undoWater(state) {
  const current = currentDay(state);
  const entries = current.entries ?? [];
  if (!entries.length) return current;
  return { ...current, entries: entries.slice(0, -1), garrafas: current.garrafas - 1,
    totalMl: (volumeUnits(current.totalMl) - volumeUnits(entries.at(-1).amountMl)) / 100 };
}

export function resetWater(state) {
  return { ...currentDay(state), entries: [], garrafas: 0, totalMl: 0, data: today() };
}

export function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

export function currentDay(state) {
  const rewarded = rewardGoal(state);
  return rewarded.data === today()
    ? rewarded
    : { ...rewarded, entries: [], garrafas: 0, totalMl: 0, data: today() };
}

export function readState(storageKey = STORAGE_KEY, initialGoal = 2, load = readProgress) {
  const defaults = { ...newState(), metaLitros: initialGoal };
  try {
    const saved = JSON.parse(load(storageKey));
    if (!saved || typeof saved !== 'object') return defaults;
    const completedDays = Array.isArray(saved.completedDays) ? [...new Set(saved.completedDays.filter(validDay))].sort() : [];
    const savedDate = new Date(typeof saved.data === 'string' ? saved.data : NaN);
    const previousDay = Number.isFinite(savedDate.getTime()) ? calendarKey(savedDate) : null;
    const knownDays = [calendarKey(), saved.startedOn, previousDay, ...completedDays].filter(validDay).sort();
    const totalMl = Number.isFinite(saved.totalMl) && saved.totalMl >= 0
      && Number.isSafeInteger(volumeUnits(saved.totalMl)) ? volumeUnits(saved.totalMl) / 100 : 0;
    const garrafas = Number.isSafeInteger(saved.garrafas) && saved.garrafas >= 0 ? saved.garrafas : 0;
    const entries = Array.isArray(saved.entries) && saved.entries.length <= garrafas
      && saved.entries.every(entry => entry && validVolume(entry.amountMl))
      && saved.entries.reduce((sum, entry) => sum + volumeUnits(entry.amountMl), 0) <= volumeUnits(totalMl)
      ? saved.entries.map(entry => ({ amountMl: volumeUnits(entry.amountMl) / 100,
        container: ['bottle', 'glass'].includes(entry.container) ? entry.container : 'custom' })) : [];
    return currentDay({
      entries,
      garrafas,
      totalMl,
      container: saved.container === 'glass' ? 'glass' : 'bottle',
      mlCopo: typeof saved.mlCopo === 'number' && validVolume(volumeUnits(saved.mlCopo) / 100)
        ? volumeUnits(saved.mlCopo) / 100 : defaults.mlCopo,
      mlGarrafa: typeof saved.mlGarrafa === 'number' && validVolume(volumeUnits(saved.mlGarrafa) / 100)
        ? volumeUnits(saved.mlGarrafa) / 100 : defaults.mlGarrafa,
      metaLitros: positiveNumber(saved.metaLitros) ? Number(saved.metaLitros) : defaults.metaLitros,
      data: saved.data,
      completedDays,
      startedOn: knownDays[0],
    });
  } catch {
    return defaults;
  }
}
