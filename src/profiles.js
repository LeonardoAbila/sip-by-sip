import { readStoredProfiles, saveProfile } from './database.js';
const SESSION_KEY = 'aguaPrototypeSession';

export function hydrationGoal(age, weight) {
  const mlPerKg = age <= 17 ? 40 : age <= 55 ? 35 : age <= 65 ? 30 : 25;
  return { mlPerKg, liters: weight * mlPerKg / 1000 };
}

export function readProfiles() {
  try {
    const profiles = readStoredProfiles();
    if (!Array.isArray(profiles)) return [];
    return profiles.filter(profile => profile && typeof profile.id === 'string'
      && typeof profile.username === 'string' && profile.username.trim()
      && typeof profile.salt === 'string' && /^[a-f0-9]{64}$/.test(profile.passwordHash)
      && (profile.onboardingComplete === false || (Number.isInteger(profile.age) && profile.age >= 1 && profile.age <= 120
      && Number.isFinite(profile.weight) && profile.weight > 0 && profile.weight <= 500
      && Number.isFinite(profile.goalLiters) && profile.goalLiters > 0)));
  } catch {
    return [];
  }
}

export function readSession() {
  try {
    return readProfiles().find(profile => profile.id === sessionStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function setSession(profile) {
  try {
    if (profile) sessionStorage.setItem(SESSION_KEY, profile.id);
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Login still works for this page when session storage is unavailable.
  }
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function registerProfile(username, password) {
  const profiles = readProfiles();
  if (profiles.some(profile => profile.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Este usuário já existe. Escolha outro nome ou entre na sua conta.');
  }
  const salt = crypto.randomUUID();
  const profile = { id: crypto.randomUUID(), username, salt,
    passwordHash: await hashPassword(password, salt), onboardingComplete: false };
  try {
    await saveProfile(profile, { create: true });
  } catch (error) {
    if (error.message?.startsWith('Este usuário já existe.')) throw error;
    throw new Error('Não foi possível salvar o cadastro. Verifique se o navegador permite armazenamento local.');
  }
  return profile;
}

export async function completeProfile(profile, age, weight) {
  if (!Number.isInteger(age) || age < 1 || age > 120 || !Number.isFinite(weight) || weight <= 0 || weight > 500) {
    throw new Error('Informe uma idade entre 1 e 120 anos e um peso válido, até 500 kg.');
  }
  const updated = { ...profile, age, weight, goalLiters: hydrationGoal(age, weight).liters, onboardingComplete: true };
  const profiles = readProfiles();
  if (!profiles.some(item => item.id === profile.id)) throw new Error('Perfil não encontrado. Entre novamente.');
  try {
    await saveProfile(updated);
  } catch {
    throw new Error('Não foi possível salvar sua meta. Verifique o armazenamento do navegador e tente novamente.');
  }
  return updated;
}
