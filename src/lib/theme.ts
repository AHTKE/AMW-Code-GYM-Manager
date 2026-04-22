// Theme and color customization (light/dark + primary color)

export type ThemeMode = 'light' | 'dark';
export interface ThemeSettings {
  mode: ThemeMode;
  primaryHsl: string;     // e.g. "0 84% 55%"
  primaryGlowHsl: string; // e.g. "14 90% 60%"
}

const KEY = 'gym_theme';

export const PRESET_COLORS: { name: string; primary: string; glow: string }[] = [
  { name: 'أحمر ناري',   primary: '0 84% 55%',   glow: '14 90% 60%' },
  { name: 'برتقالي',     primary: '24 95% 53%',  glow: '38 92% 55%' },
  { name: 'أصفر ذهبي',   primary: '45 95% 50%',  glow: '50 100% 60%' },
  { name: 'أخضر طاقة',   primary: '142 70% 45%', glow: '160 70% 50%' },
  { name: 'سماوي',       primary: '195 90% 48%', glow: '210 95% 55%' },
  { name: 'أزرق',        primary: '220 90% 55%', glow: '230 90% 60%' },
  { name: 'بنفسجي',      primary: '270 80% 55%', glow: '285 85% 60%' },
  { name: 'وردي',        primary: '330 85% 55%', glow: '340 90% 60%' },
];

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'dark',
  primaryHsl: PRESET_COLORS[0].primary,
  primaryGlowHsl: PRESET_COLORS[0].glow,
};

export function getTheme(): ThemeSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_THEME, ...JSON.parse(raw) } : DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}

export function saveTheme(t: ThemeSettings) {
  localStorage.setItem(KEY, JSON.stringify(t));
  applyTheme(t);
}

export function applyTheme(t: ThemeSettings = getTheme()) {
  const root = document.documentElement;
  if (t.mode === 'light') root.classList.add('light');
  else root.classList.remove('light');
  root.style.setProperty('--primary', t.primaryHsl);
  root.style.setProperty('--primary-glow', t.primaryGlowHsl);
  root.style.setProperty('--ring', t.primaryHsl);
  root.style.setProperty('--sidebar-primary', t.primaryHsl);
  root.style.setProperty('--sidebar-ring', t.primaryHsl);
}
