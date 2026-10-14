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
  return { garrafas: 0, totalMl: 0, mlGarrafa: 500, metaLitros: 2, data: today(), completedDays: [], startedOn: calendarKey() };
}

export function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}

export function currentDay(state) {
  const rewarded = rewardGoal(state);
  return rewarded.data === today()
    ? rewarded
    : { ...rewarded, garrafas: 0, totalMl: 0, data: today() };
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
    return currentDay({
      garrafas: Number.isSafeInteger(saved.garrafas) && saved.garrafas >= 0 ? saved.garrafas : 0,
      totalMl: Number.isFinite(saved.totalMl) && saved.totalMl >= 0 ? saved.totalMl : 0,
      mlGarrafa: positiveNumber(saved.mlGarrafa) ? Number(saved.mlGarrafa) : defaults.mlGarrafa,
      metaLitros: positiveNumber(saved.metaLitros) ? Number(saved.metaLitros) : defaults.metaLitros,
      data: saved.data,
      completedDays,
      startedOn: knownDays[0],
    });
  } catch {
    return defaults;
  }
}
