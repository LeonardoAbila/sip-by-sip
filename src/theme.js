export const THEME_KEY = 'aguaAppTheme';

export function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // The toggle still works when browser storage is unavailable.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const COLOR_KEY = 'aguaAppColor';
export const appColors = ['green', 'blue', 'purple', 'rose', 'orange'];

export function readColor() {
  try {
    const saved = localStorage.getItem(COLOR_KEY);
    if (appColors.includes(saved)) return saved;
  } catch {
    // Color choices still work for this session.
  }
  return 'green';
}
