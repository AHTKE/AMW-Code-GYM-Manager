import { useState } from 'react';
import { getPlans, addPlan, updatePlan, deletePlan } from '@/lib/gymStore';
import { Plan, PlanDuration } from '@/types/gym';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { fmtCurrency } from '@/lib/format';

const DURATION_DAYS: Record<PlanDuration, number> = {
  monthly: 30, quarterly: 90, 'half-year': 180, yearly: 365, custom: 30,
};

const PlansManager = () => {
  const [plans, setPlans] = useState<Plan[]>(getPlans());
  const [editing, setEditing] = useState<Plan | null>(null);

  const refresh = () => setPlans(getPlans());

  const blank = (): Plan => ({
    id: crypto.randomUUID(),
    name: '',
    duration: 'monthly',
    durationDays: 30,
    price: 0,
    includesPersonalTraining: false,
    sessionsTotal: 0,
    allowedDays: [],
    freezeDaysAllowed: 7,
    active: true,
    color: '#ef4444',
    createdAt: Date.now(),
  });

  const handleSave = (p: Plan) => {
    if (plans.some(x => x.id === p.id)) updatePlan(p);
    else addPlan(p);
    refresh();
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> باقة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map(p => (
          <div key={p.id} className="p-5 rounded-xl border-2 hover:scale-[1.02] transition-transform" style={{ borderColor: p.color, background: `linear-gradient(135deg, ${p.color}15, transparent)` }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-cairo font-black text-lg">{p.name}</h3>
              {!p.active && <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded font-cairo">معطل</span>}
            </div>
            <div className="text-3xl font-black font-cairo mb-1" style={{color: p.color}}>{fmtCurrency(p.price)}</div>
            <div className="text-xs text-muted-foreground font-cairo mb-3">{p.durationDays} يوم</div>
            {p.description && <p className="text-sm text-muted-foreground font-cairo mb-3">{p.description}</p>}
            <div className="flex items-center gap-1.5 text-xs font-cairo mb-3">
              {p.includesPersonalTraining && <span className="px-2 py-0.5 rounded bg-success/20 text-success">✓ تدريب شخصي</span>}
              {p.classesPerWeek && <span className="px-2 py-0.5 rounded bg-secondary">{p.classesPerWeek} حصة/أسبوع</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1">
                <Edit className="w-3 h-3" /> تعديل
              </button>
              <button onClick={() => { if(confirm('حذف الباقة؟')){ deletePlan(p.id); refresh(); } }} className="px-3 py-2 rounded bg-destructive/10 text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && <PlanForm plan={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  );
};

const PlanForm = ({ plan, onSave, onClose }: { plan: Plan; onSave: (p: Plan) => void; onClose: () => void }) => {
  const [p, setP] = useState<Plan>(plan);
  const upd = (k: keyof Plan, v: any) => setP(x => ({ ...x, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); if(!p.name.trim()){alert('أدخل اسم الباقة'); return;} onSave(p);}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{plan.name?'تعديل الباقة':'إضافة باقة'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">اسم الباقة *</label>
          <input value={p.name} onChange={e=>upd('name',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">المدة</label>
            <select value={p.duration} onChange={e=>{const d=e.target.value as PlanDuration; upd('duration',d); if(d!=='custom') upd('durationDays', DURATION_DAYS[d]);}} className="w-full h-10 px-3 bg-secondary rounded mt-1">
              <option value="monthly">شهري</option>
              <option value="quarterly">3 شهور</option>
              <option value="half-year">6 شهور</option>
              <option value="yearly">سنوي</option>
              <option value="custom">مخصص</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">عدد الأيام</label>
            <input type="number" value={p.durationDays} onChange={e=>upd('durationDays', Number(e.target.value)||0)} disabled={p.duration!=='custom'} className="w-full h-10 px-3 bg-secondary rounded mt-1 disabled:opacity-60" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">السعر (ج.م) *</label>
          <input type="number" value={p.price} onChange={e=>upd('price', Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">الوصف</label>
          <textarea value={p.description||''} onChange={e=>upd('description',e.target.value)} className="w-full px-3 py-2 bg-secondary rounded mt-1 min-h-[60px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">حصص/أسبوع (اختياري)</label>
            <input type="number" value={p.classesPerWeek||''} onChange={e=>upd('classesPerWeek', Number(e.target.value)||undefined)} className="w-full h-10 px-3 bg-secondary rounded mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">اللون</label>
            <input type="color" value={p.color||'#ef4444'} onChange={e=>upd('color',e.target.value)} className="w-full h-10 bg-secondary rounded mt-1 cursor-pointer" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">عدد الحصص الكلي (0 = غير محدود)</label>
            <input type="number" value={p.sessionsTotal||0} onChange={e=>upd('sessionsTotal', Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">أيام التجميد المسموحة</label>
            <input type="number" value={p.freezeDaysAllowed||0} onChange={e=>upd('freezeDaysAllowed', Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo block mb-1">الأيام المسموحة (لو فاضية = كل الأيام)</label>
          <DaysSelector value={p.allowedDays||[]} onChange={v=>upd('allowedDays', v)} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={p.includesPersonalTraining} onChange={e=>upd('includesPersonalTraining',e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">يشمل تدريب شخصي</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={p.active} onChange={e=>upd('active',e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">الباقة نشطة (تظهر للأعضاء الجدد)</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

const DAY_LABELS = ['ح','ن','ث','ر','خ','ج','س'];
const DAY_FULL = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

export const DaysSelector = ({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) => {
  const toggle = (d: number) => {
    if (value.includes(d)) onChange(value.filter(x => x !== d));
    else onChange([...value, d].sort());
  };
  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAY_LABELS.map((lbl, i) => (
        <button
          type="button"
          key={i}
          onClick={() => toggle(i)}
          title={DAY_FULL[i]}
          className={`w-10 h-10 rounded-lg font-cairo font-bold text-sm border-2 transition ${
            value.includes(i)
              ? 'bg-primary text-primary-foreground border-primary shadow-glow'
              : 'bg-secondary text-muted-foreground border-border hover:border-primary/50'
          }`}
        >
          {lbl}
        </button>
      ))}
    </div>
  );
};

export default PlansManager;

