// Keyboard shortcuts manager.
// Each shortcut maps a key combo (e.g. "Ctrl+M") to an action ID.

export type ShortcutAction =
  | 'goto-scanner'
  | 'goto-dashboard'
  | 'goto-members'
  | 'goto-subscriptions'
  | 'goto-attendance'
  | 'goto-trainers'
  | 'goto-classes'
  | 'goto-offers'
  | 'goto-finance'
  | 'goto-settings'
  | 'new-member'
  | 'new-subscription'
  | 'toggle-theme'
  | 'toggle-fullscreen'
  | 'show-shortcuts'
  | 'logout'
  | 'focus-scan';

export interface Shortcut {
  combo: string;       // normalized e.g. "ctrl+m" or "alt+s"
  action: ShortcutAction;
  label: string;
}

const KEY = 'gym_shortcuts';

export const ACTION_LABELS: Record<ShortcutAction, string> = {
  'goto-scanner': 'فتح شاشة الماسح',
  'goto-dashboard': 'فتح لوحة التحكم',
  'goto-members': 'فتح الأعضاء',
  'goto-subscriptions': 'فتح الاشتراكات',
  'goto-attendance': 'فتح سجل الحضور',
  'goto-trainers': 'فتح المدربين',
  'goto-classes': 'فتح الحصص',
  'goto-offers': 'فتح العروض والكوبونات',
  'goto-finance': 'فتح الحسابات',
  'goto-settings': 'فتح الإعدادات',
  'new-member': 'إضافة عضو جديد',
  'new-subscription': 'إنشاء اشتراك جديد',
  'toggle-theme': 'تبديل الوضع الليلي/النهاري',
  'toggle-fullscreen': 'ملء الشاشة (تكبير/تصغير)',
  'show-shortcuts': 'عرض قائمة الاختصارات',
  'logout': 'تسجيل الخروج (إغلاق الوردية)',
  'focus-scan': 'التركيز على حقل المسح',
};

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { combo: 'alt+s', action: 'goto-scanner', label: 'الماسح' },
  { combo: 'alt+d', action: 'goto-dashboard', label: 'لوحة التحكم' },
  { combo: 'alt+m', action: 'goto-members', label: 'الأعضاء' },
  { combo: 'alt+u', action: 'goto-subscriptions', label: 'الاشتراكات' },
  { combo: 'alt+a', action: 'goto-attendance', label: 'الحضور' },
  { combo: 'alt+r', action: 'goto-trainers', label: 'المدربين' },
  { combo: 'alt+c', action: 'goto-classes', label: 'الحصص' },
  { combo: 'alt+o', action: 'goto-offers', label: 'العروض' },
  { combo: 'alt+f', action: 'goto-finance', label: 'الحسابات' },
  { combo: 'alt+t', action: 'toggle-theme', label: 'تبديل الثيم' },
  { combo: 'alt+n', action: 'new-member', label: 'عضو جديد' },
  { combo: 'alt+q', action: 'logout', label: 'خروج' },
  { combo: 'f11', action: 'toggle-fullscreen', label: 'ملء الشاشة' },
  { combo: 'f1', action: 'show-shortcuts', label: 'عرض الاختصارات' },
  { combo: '/', action: 'focus-scan', label: 'تركيز المسح' },
];

export function getShortcuts(): Shortcut[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SHORTCUTS;
    const parsed = JSON.parse(raw) as Shortcut[];
    // Ensure F11 + F1 always exist as defaults if user removed them
    const hasFullscreen = parsed.some(s => s.action === 'toggle-fullscreen');
    const hasHelp = parsed.some(s => s.action === 'show-shortcuts');
    if (!hasFullscreen) parsed.push({ combo: 'f11', action: 'toggle-fullscreen', label: 'ملء الشاشة' });
    if (!hasHelp) parsed.push({ combo: 'f1', action: 'show-shortcuts', label: 'عرض الاختصارات' });
    return parsed;
  } catch { return DEFAULT_SHORTCUTS; }
}

export function saveShortcuts(list: Shortcut[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');
  if (e.metaKey) parts.push('meta');
  const k = e.key.toLowerCase();
  if (!['control','alt','shift','meta'].includes(k)) parts.push(k);
  return parts.join('+');
}

// Toggle browser/electron fullscreen
export function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  } catch {}
}

// Hook helper (registers a global listener that dispatches custom events)
export function installShortcutListener(handler: (action: ShortcutAction, e: KeyboardEvent) => void) {
  const listener = (e: KeyboardEvent) => {
    // Don't fire when typing inside inputs/textareas (except Esc, /, F-keys)
    const tag = (e.target as HTMLElement)?.tagName;
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
    const isFKey = /^f\d{1,2}$/i.test(e.key);
    const combo = eventToCombo(e);
    if (isEditable && combo === '/') return; // let user type /
    const list = getShortcuts();
    const match = list.find(s => s.combo === combo);
    if (match) {
      // Allow F-keys and combos with modifiers even in inputs
      if (isEditable && !e.ctrlKey && !e.altKey && !e.metaKey && !isFKey) return;
      e.preventDefault();
      handler(match.action, e);
    }
  };
  window.addEventListener('keydown', listener, true);
  return () => window.removeEventListener('keydown', listener, true);
}
