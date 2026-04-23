// Floating dialog showing all configured keyboard shortcuts.
// Triggered by clicking the keyboard icon in the top bar or pressing F1.
import { X, Keyboard } from 'lucide-react';
import { getShortcuts, ACTION_LABELS } from '@/lib/gymShortcuts';

interface Props { onClose: () => void; }

const ShortcutsHelpDialog = ({ onClose }: Props) => {
  const shortcuts = getShortcuts().filter(s => s.combo);

  const formatCombo = (combo: string) =>
    combo.split('+').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' + ');

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <h2 className="font-cairo font-black text-lg flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" /> اختصارات الكيبورد
          </h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-auto p-3 space-y-1.5">
          {shortcuts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-cairo text-sm">
              لا توجد اختصارات مفعلة. اطلب من المدير إضافة اختصارات أو فعّلها من الإعدادات الشخصية.
            </div>
          )}
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 bg-secondary/40 rounded-lg hover:bg-secondary transition">
              <span className="font-cairo text-sm">{ACTION_LABELS[s.action]}</span>
              <kbd className="px-2.5 py-1 rounded bg-card border border-border font-mono text-xs font-black text-primary shadow-sm">
                {formatCombo(s.combo)}
              </kbd>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border bg-secondary/20">
          <p className="text-[11px] text-muted-foreground font-cairo text-center">
            اضغط <kbd className="px-1.5 py-0.5 bg-card rounded border border-border font-mono text-[10px]">F1</kbd> لعرض هذه القائمة في أي وقت
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpDialog;
