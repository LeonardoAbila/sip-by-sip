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
// The interface uses a single blue accent in both themes.
export function readColor() {
  return 'blue';
}
