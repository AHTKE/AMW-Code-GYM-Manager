// Keyboard shortcuts manager.
// Each shortcut maps a key combo (e.g. "Ctrl+M") to an action ID.

export type ShortcutAction =
  | 'goto-scanner'
  | 'goto-dashboard'
  | 'goto-members'
  | 'goto-subscriptions'
  | 'goto-attendance'
  | 'goto-finance'
  | 'goto-settings'
  | 'new-member'
  | 'new-subscription'
  | 'toggle-theme'
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
  'goto-finance': 'فتح الحسابات',
  'goto-settings': 'فتح الإعدادات',
  'new-member': 'إضافة عضو جديد',
  'new-subscription': 'إنشاء اشتراك جديد',
  'toggle-theme': 'تبديل الوضع الليلي/النهاري',
  'logout': 'تسجيل الخروج',
  'focus-scan': 'التركيز على حقل المسح',
};

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  { combo: 'alt+s', action: 'goto-scanner', label: 'الماسح' },
  { combo: 'alt+d', action: 'goto-dashboard', label: 'لوحة التحكم' },
  { combo: 'alt+m', action: 'goto-members', label: 'الأعضاء' },
  { combo: 'alt+u', action: 'goto-subscriptions', label: 'الاشتراكات' },
  { combo: 'alt+a', action: 'goto-attendance', label: 'الحضور' },
  { combo: 'alt+f', action: 'goto-finance', label: 'الحسابات' },
  { combo: 'alt+t', action: 'toggle-theme', label: 'تبديل الثيم' },
  { combo: 'alt+n', action: 'new-member', label: 'عضو جديد' },
  { combo: 'alt+q', action: 'logout', label: 'خروج' },
  { combo: '/', action: 'focus-scan', label: 'تركيز المسح' },
];

export function getShortcuts(): Shortcut[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SHORTCUTS;
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

// Hook helper (registers a global listener that dispatches custom events)
export function installShortcutListener(handler: (action: ShortcutAction, e: KeyboardEvent) => void) {
  const listener = (e: KeyboardEvent) => {
    // Don't fire when typing inside inputs/textareas (except Esc and / focus)
    const tag = (e.target as HTMLElement)?.tagName;
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
    const combo = eventToCombo(e);
    if (isEditable && combo === '/') return; // let user type /
    const list = getShortcuts();
    const match = list.find(s => s.combo === combo);
    if (match) {
      if (isEditable && !e.ctrlKey && !e.altKey && !e.metaKey) return;
      e.preventDefault();
      handler(match.action, e);
    }
  };
  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
}
