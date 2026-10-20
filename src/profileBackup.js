// A transport format, independent of SQLite and forgiving startup migrations.
export const BACKUP_FORMAT = 'sip-by-sip-profile';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export class BackupError extends Error {
  constructor(code = 'invalid') {
    super(code);
    this.code = code;
  }
}

function requireValid(condition) {
  if (!condition) throw new BackupError();
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function activeDay(value) {
  if (day(value)) return value;
  if (typeof value !== 'string') return null;
  const match = /^[A-Za-z]{3} ([A-Za-z]{3}) (\d{1,2}) (\d{4})$/.exec(value);
  if (!match) return null;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[1]) + 1;
  const key = `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  return day(key) ? key : null;
}

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function total(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    && Number.isSafeInteger(Math.round(value * 100))
    && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
}

function amount(value) {
  return total(value) && value >= 0.01 && value <= 1_000_000;
}

function counter(value) {
  requireValid(object(value) && total(value.totalMl) && Number.isSafeInteger(value.garrafas) && value.garrafas >= 0);
  requireValid(Array.isArray(value.entries) && value.entries.length <= value.garrafas);
  let units = 0;
  const entries = value.entries.map(entry => {
    requireValid(object(entry) && amount(entry.amountMl) && ['bottle', 'glass', 'custom'].includes(entry.container));
    units += Math.round(entry.amountMl * 100);
    requireValid(Number.isSafeInteger(units));
    return { amountMl: entry.amountMl, container: entry.container };
  });
  requireValid(units <= Math.round(value.totalMl * 100));
  return { totalMl: value.totalMl, garrafas: value.garrafas, entries };
}

export function validateBackup(value) {
  requireValid(object(value) && value.format === BACKUP_FORMAT);
  if (value.version !== BACKUP_VERSION) throw new BackupError('version');
  requireValid(typeof value.exportedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value.exportedAt)
    && Number.isFinite(Date.parse(value.exportedAt))
    && new Date(value.exportedAt).toISOString() === value.exportedAt);
  const profile = value.profile;
  requireValid(object(profile) && typeof profile.username === 'string' && profile.username.trim().length > 0);
  requireValid(profile.onboardingComplete === true && Number.isInteger(profile.age) && profile.age >= 1 && profile.age <= 120);
  requireValid(positive(profile.weight) && profile.weight <= 500 && positive(profile.goalLiters));
  const progress = value.progress;
  requireValid(object(progress) && amount(progress.mlGarrafa) && amount(progress.mlCopo)
    && positive(progress.metaLitros) && ['bottle', 'glass'].includes(progress.container));
  const data = activeDay(progress.data);
  requireValid(data && day(progress.startedOn));
  const active = counter(progress);
  requireValid(object(progress.dailyTotals) && object(progress.dailyProgress));
  const dailyTotals = {};
  for (const [key, value] of Object.entries(progress.dailyTotals)) {
    requireValid(day(key) && total(value) && key !== data);
    dailyTotals[key] = value;
  }
  const dailyProgress = {};
  for (const [key, value] of Object.entries(progress.dailyProgress)) {
    requireValid(day(key) && key !== data);
    const snapshot = counter(value);
    requireValid(Object.hasOwn(dailyTotals, key) && dailyTotals[key] === snapshot.totalMl);
    dailyProgress[key] = snapshot;
  }
  requireValid(Array.isArray(progress.completedDays) && progress.completedDays.every(day)
    && new Set(progress.completedDays).size === progress.completedDays.length);
  const knownDays = [data, ...Object.keys(dailyTotals), ...progress.completedDays];
  requireValid(knownDays.every(key => key >= progress.startedOn));
  return {
    format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: value.exportedAt,
    profile: { username: profile.username, age: profile.age, weight: profile.weight,
      goalLiters: profile.goalLiters, onboardingComplete: true },
    progress: { ...active, data, startedOn: progress.startedOn, dailyTotals, dailyProgress,
      completedDays: [...progress.completedDays], container: progress.container,
      mlGarrafa: progress.mlGarrafa, mlCopo: progress.mlCopo, metaLitros: progress.metaLitros },
  };
}

export function createBackup(profile, progress, exportedAt = new Date().toISOString()) {
  return validateBackup({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt, profile, progress });
}

export function serializeBackup(backup) {
  const json = JSON.stringify(validateBackup(backup), null, 2);
  if (new TextEncoder().encode(json).byteLength > MAX_BACKUP_BYTES) throw new BackupError('size');
  return json;
}

export function parseBackup(text) {
  if (typeof text !== 'string') throw new BackupError();
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new BackupError('size');
  let value;
  try { value = JSON.parse(text); } catch { throw new BackupError(); }
  return validateBackup(value);
}

export async function readBackupFile(file) {
  if (!file || file.size > MAX_BACKUP_BYTES) throw new BackupError('size');
  return parseBackup(await file.text());
}
