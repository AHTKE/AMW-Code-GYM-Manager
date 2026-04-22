// Theme + shortcuts settings panel inside admin Settings.
import { useState, useEffect } from 'react';
import { Sun, Moon, Palette, Keyboard as KbdIcon, Plus, Trash2, Check } from 'lucide-react';
import { getTheme, saveTheme, PRESET_COLORS, ThemeSettings } from '@/lib/theme';
import { getShortcuts, saveShortcuts, DEFAULT_SHORTCUTS, Shortcut, ACTION_LABELS, ShortcutAction, eventToCombo } from '@/lib/gymShortcuts';

interface Props { showTheme?: boolean; showShortcuts?: boolean; }

const ThemeAndShortcutsPanel = ({ showTheme = true, showShortcuts = true }: Props) => {
  const [theme, setTheme] = useState<ThemeSettings>(getTheme());
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(getShortcuts());
  const [recordingIdx, setRecordingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (recordingIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (['Control','Alt','Shift','Meta'].includes(e.key)) return;
      e.preventDefault();
      const combo = eventToCombo(e);
      const next = [...shortcuts];
      next[recordingIdx] = { ...next[recordingIdx], combo };
      setShortcuts(next);
      setRecordingIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recordingIdx, shortcuts]);

  const applyTheme = (t: ThemeSettings) => { setTheme(t); saveTheme(t); };
  const applyShortcuts = (list: Shortcut[]) => { setShortcuts(list); saveShortcuts(list); };

  const addShortcut = () => {
    applyShortcuts([...shortcuts, { combo: '', action: 'goto-scanner', label: 'جديد' }]);
  };
  const removeShortcut = (i: number) => {
    applyShortcuts(shortcuts.filter((_, idx) => idx !== i));
  };
  const resetShortcuts = () => {
    if (confirm('استعادة الاختصارات الافتراضية؟')) applyShortcuts(DEFAULT_SHORTCUTS);
  };

  return (
    <div className="space-y-6">
      {/* Theme mode */}
      {showTheme && (
      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-cairo font-black text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" /> الوضع والألوان
        </h3>
        <div className="flex gap-2">
          <button onClick={()=>applyTheme({...theme, mode: 'dark'})} className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-cairo font-bold ${theme.mode==='dark' ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary'}`}>
            <Moon className="w-4 h-4" /> الوضع الليلي
          </button>
          <button onClick={()=>applyTheme({...theme, mode: 'light'})} className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-cairo font-bold ${theme.mode==='light' ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-secondary'}`}>
            <Sun className="w-4 h-4" /> الوضع النهاري
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground font-cairo">اللون الأساسي</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-2">
            {PRESET_COLORS.map(c => {
              const active = theme.primaryHsl === c.primary;
              return (
                <button key={c.name} onClick={()=>applyTheme({...theme, primaryHsl: c.primary, primaryGlowHsl: c.glow})}
                  title={c.name}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center transition ${active ? 'border-foreground scale-110' : 'border-transparent hover:border-foreground/30'}`}
                  style={{ background: `hsl(${c.primary})` }}>
                  {active && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground font-cairo mt-2">سيتم تطبيق اللون فوراً على كل الواجهات.</p>
        </div>
      </section>
      )}

      {/* Shortcuts */}
      {showShortcuts && (
      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo font-black text-lg flex items-center gap-2">
            <KbdIcon className="w-5 h-5 text-primary" /> اختصارات الكيبورد
          </h3>
          <div className="flex gap-2">
            <button onClick={addShortcut} className="flex items-center gap-1 px-3 py-1.5 rounded bg-secondary text-xs font-cairo font-bold">
              <Plus className="w-3.5 h-3.5" /> اختصار
            </button>
            <button onClick={resetShortcuts} className="px-3 py-1.5 rounded bg-warning/15 text-warning text-xs font-cairo font-bold">افتراضي</button>
          </div>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-secondary/40 rounded-lg">
              <button onClick={()=>setRecordingIdx(i)} className={`min-w-[110px] px-3 py-2 rounded font-mono text-xs font-bold border ${recordingIdx===i ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-border bg-card'}`}>
                {recordingIdx===i ? 'اضغط...' : (s.combo || '— لم يحدد —')}
              </button>
              <select value={s.action} onChange={e=>{
                const next = [...shortcuts];
                next[i] = { ...next[i], action: e.target.value as ShortcutAction, label: ACTION_LABELS[e.target.value as ShortcutAction] };
                applyShortcuts(next);
              }} className="flex-1 h-9 px-2 bg-card rounded font-cairo text-sm">
                {(Object.keys(ACTION_LABELS) as ShortcutAction[]).map(a => (
                  <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                ))}
              </select>
              <button onClick={()=>removeShortcut(i)} className="p-2 rounded bg-destructive/10 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {shortcuts.length === 0 && <p className="text-center text-sm text-muted-foreground font-cairo py-4">لا توجد اختصارات.</p>}
        </div>
        <p className="text-[11px] text-muted-foreground font-cairo">انقر على الزر الأيمن واضغط مفتاح أو دمج (مثل Ctrl+M) لتسجيله.</p>
      </section>
      )}
    </div>
  );
};

export default ThemeAndShortcutsPanel;
