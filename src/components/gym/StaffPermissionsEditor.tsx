// Modal to edit per-staff feature permissions (or apply to all staff at once).
import { useState } from 'react';
import { Staff } from '@/types/gym';
import { X, Save, CheckCheck, Square, RotateCcw, Users } from 'lucide-react';
import {
  GymStaffPermissions, PERMISSION_GROUPS, getStaffPermissions,
  saveStaffPermissions, clearStaffPermissions, ALL_PERMISSIONS, DEFAULT_PERMISSIONS,
  GymFeatureKey, saveGlobalPermissions,
} from '@/lib/gymPermissions';
import { getStaff } from '@/lib/gymStore';

interface Props {
  staff: Staff | null;       // null = bulk mode (all staff)
  onClose: () => void;
}

const StaffPermissionsEditor = ({ staff, onClose }: Props) => {
  const isBulk = !staff;
  const [perms, setPerms] = useState<GymStaffPermissions>(
    staff ? getStaffPermissions(staff.id) : DEFAULT_PERMISSIONS
  );

  const toggle = (k: GymFeatureKey) => {
    setPerms(p => ({
      ...p,
      features: { ...p.features, [k]: !p.features[k] },
    }));
  };

  const setAll = (val: boolean) => {
    const all: Partial<Record<GymFeatureKey, boolean>> = {};
    PERMISSION_GROUPS.forEach(g => g.items.forEach(i => { all[i.key] = val; }));
    setPerms({ ...perms, features: all });
  };

  const save = () => {
    if (isBulk) {
      if (!confirm('سيتم تطبيق هذه الصلاحيات على جميع الموظفين الحاليين. متابعة؟')) return;
      saveGlobalPermissions(perms);
      getStaff().forEach(s => saveStaffPermissions(s.id, perms));
    } else {
      saveStaffPermissions(staff!.id, perms);
    }
    onClose();
  };

  const reset = () => {
    if (!confirm('إعادة الصلاحيات للوضع الافتراضي؟')) return;
    if (staff) clearStaffPermissions(staff.id);
    setPerms(DEFAULT_PERMISSIONS);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isBulk && <Users className="w-5 h-5 text-primary" />}
            <div>
              <h2 className="font-cairo font-black text-xl">
                {isBulk ? 'صلاحيات جميع الموظفين' : `صلاحيات ${staff!.name}`}
              </h2>
              <p className="text-xs text-muted-foreground font-cairo">
                {isBulk
                  ? 'سيتم تطبيق هذه الصلاحيات على كل الموظفين الحاليين والجدد'
                  : 'حدد الوظائف المسموح للموظف باستخدامها'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3 border-b border-border flex flex-wrap gap-2">
          <button onClick={()=>setAll(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-success/15 text-success text-xs font-cairo font-bold">
            <CheckCheck className="w-3.5 h-3.5" /> تفعيل الكل
          </button>
          <button onClick={()=>setAll(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-destructive/15 text-destructive text-xs font-cairo font-bold">
            <Square className="w-3.5 h-3.5" /> إلغاء الكل
          </button>
          <button onClick={()=>setPerms(ALL_PERMISSIONS)} className="px-3 py-1.5 rounded bg-secondary text-xs font-cairo font-bold">صلاحيات كاملة</button>
          <button onClick={()=>setPerms(DEFAULT_PERMISSIONS)} className="px-3 py-1.5 rounded bg-secondary text-xs font-cairo font-bold">الافتراضي</button>
          <button onClick={reset} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded bg-warning/15 text-warning text-xs font-cairo font-bold">
            <RotateCcw className="w-3.5 h-3.5" /> إعادة تعيين
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {PERMISSION_GROUPS.map(group => (
            <div key={group.title} className="bg-secondary/40 rounded-xl border border-border p-3">
              <div className="font-cairo font-black text-sm mb-2 text-primary">{group.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map(it => {
                  const on = !!perms.features[it.key];
                  return (
                    <label key={it.key} className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm font-cairo transition ${on ? 'bg-success/10 border border-success/40' : 'bg-card border border-border'}`}>
                      <input type="checkbox" checked={on} onChange={()=>toggle(it.key)} className="w-4 h-4 accent-primary" />
                      <span>{it.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-secondary/40 rounded-xl border border-border p-3">
            <div className="font-cairo font-black text-sm mb-2 text-primary">إعدادات إضافية</div>
            <label className="flex items-center gap-2 p-2 rounded cursor-pointer text-sm font-cairo bg-card border border-border">
              <input type="checkbox" checked={!!perms.showRevenueStats} onChange={e=>setPerms({...perms, showRevenueStats: e.target.checked})} className="w-4 h-4 accent-primary" />
              <span>إظهار إحصائيات الإيرادات للموظف</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button onClick={save} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">
            <Save className="w-4 h-4" /> حفظ الصلاحيات
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffPermissionsEditor;
