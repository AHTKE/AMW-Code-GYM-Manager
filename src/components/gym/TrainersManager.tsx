import { useState } from 'react';
import { getTrainers, addTrainer, updateTrainer, deleteTrainer } from '@/lib/gymStore';
import { Trainer } from '@/types/gym';
import { Plus, Edit, Trash2, X, User, Phone } from 'lucide-react';
import { fmtCurrency } from '@/lib/format';

const TrainersManager = () => {
  const [trainers, setTrainers] = useState<Trainer[]>(getTrainers());
  const [editing, setEditing] = useState<Trainer | null>(null);
  const refresh = () => setTrainers(getTrainers());

  const blank = (): Trainer => ({
    id: crypto.randomUUID(), name: '', phone: '', specialty: '',
    active: true, createdAt: Date.now(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={()=>setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> مدرب جديد
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {trainers.map(t => (
          <div key={t.id} className="p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {t.photo ? <img src={t.photo} alt={t.name} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="font-cairo font-black">{t.name}</div>
                <div className="text-xs text-primary font-cairo">{t.specialty}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-cairo flex items-center gap-1 mb-1">
              <Phone className="w-3 h-3" /> {t.phone || '—'}
            </div>
            {t.monthlySalary != null && t.monthlySalary > 0 && (
              <div className="text-xs font-cairo">الراتب الشهري: <span className="font-bold text-success">{fmtCurrency(t.monthlySalary)}</span></div>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setEditing(t)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1">
                <Edit className="w-3 h-3" /> تعديل
              </button>
              <button onClick={()=>{if(confirm('حذف المدرب؟')){deleteTrainer(t.id); refresh();}}} className="px-3 py-2 rounded bg-destructive/10 text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {trainers.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12 font-cairo">لا يوجد مدربين بعد.</div>}
      </div>

      {editing && <TrainerForm trainer={editing} onSave={t=>{ if(trainers.some(x=>x.id===t.id))updateTrainer(t); else addTrainer(t); refresh(); setEditing(null); }} onClose={()=>setEditing(null)} />}
    </div>
  );
};

const TrainerForm = ({ trainer, onSave, onClose }: { trainer: Trainer; onSave: (t: Trainer)=>void; onClose: ()=>void }) => {
  const [t, setT] = useState<Trainer>(trainer);
  const upd = (k: keyof Trainer, v: any) => setT(x => ({ ...x, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => upd('photo', r.result as string); r.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); if(!t.name.trim()){alert('أدخل الاسم'); return;} onSave(t);}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{trainer.name?'تعديل':'إضافة مدرب'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
            {t.photo ? <img src={t.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-10 h-10 text-muted-foreground" />}
          </div>
          <label className="flex-1 cursor-pointer px-4 py-2 rounded-lg bg-secondary hover:bg-accent font-cairo font-bold text-sm text-center">
            {t.photo ? 'تغيير الصورة' : 'إضافة صورة'}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        </div>
        <input value={t.name} onChange={e=>upd('name',e.target.value)} placeholder="الاسم *" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <input value={t.phone} onChange={e=>upd('phone',e.target.value)} placeholder="رقم الهاتف" className="w-full h-10 px-3 bg-secondary rounded font-cairo" />
        <input value={t.specialty} onChange={e=>upd('specialty',e.target.value)} placeholder="التخصص (مثل: كروس فيت، يوجا)" className="w-full h-10 px-3 bg-secondary rounded font-cairo" />
        <textarea value={t.bio||''} onChange={e=>upd('bio',e.target.value)} placeholder="نبذة عن المدرب" className="w-full px-3 py-2 bg-secondary rounded min-h-[60px] font-cairo" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">الراتب الشهري (ج.م)</label>
            <input type="number" value={t.monthlySalary||''} onChange={e=>upd('monthlySalary', Number(e.target.value)||undefined)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">عمولة/حصة (ج.م)</label>
            <input type="number" value={t.commissionPerSession||''} onChange={e=>upd('commissionPerSession', Number(e.target.value)||undefined)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={t.active} onChange={e=>upd('active',e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">المدرب نشط</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

export default TrainersManager;
