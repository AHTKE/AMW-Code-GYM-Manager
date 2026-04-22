import { useState } from 'react';
import { getClasses, addClass, updateClass, deleteClass, getTrainers } from '@/lib/gymStore';
import { ClassSchedule } from '@/types/gym';
import { Plus, Edit, Trash2, X, Clock, Users } from 'lucide-react';

const DAYS_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

const ClassesManager = () => {
  const [classes, setClasses] = useState<ClassSchedule[]>(getClasses());
  const [editing, setEditing] = useState<ClassSchedule | null>(null);
  const refresh = () => setClasses(getClasses());

  const blank = (): ClassSchedule => ({
    id: crypto.randomUUID(), name: '', trainerId: '', trainerName: '',
    dayOfWeek: 0, startTime: '18:00', endTime: '19:00', capacity: 20, active: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={()=>setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> حصة جديدة
        </button>
      </div>

      {[0,1,2,3,4,5,6].map(day => {
        const dayClasses = classes.filter(c => c.dayOfWeek === day && c.active).sort((a,b)=>a.startTime.localeCompare(b.startTime));
        if (dayClasses.length === 0) return null;
        return (
          <div key={day}>
            <h3 className="font-cairo font-black text-base text-primary mb-2">{DAYS_AR[day]}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dayClasses.map(c => (
                <div key={c.id} className="p-4 bg-card rounded-xl border border-border">
                  <div className="font-cairo font-black text-base">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-cairo flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {c.startTime} - {c.endTime}</div>
                  <div className="text-xs text-muted-foreground font-cairo">المدرب: <span className="text-foreground">{c.trainerName}</span></div>
                  <div className="text-xs text-muted-foreground font-cairo flex items-center gap-1"><Users className="w-3 h-3" /> سعة {c.capacity} عضو</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>setEditing(c)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> تعديل</button>
                    <button onClick={()=>{if(confirm('حذف الحصة؟')){deleteClass(c.id); refresh();}}} className="px-3 py-2 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {classes.length === 0 && <div className="text-center text-muted-foreground py-12 font-cairo">لا توجد حصص بعد.</div>}

      {editing && <ClassForm cls={editing} onSave={c=>{ if(classes.some(x=>x.id===c.id))updateClass(c); else addClass(c); refresh(); setEditing(null); }} onClose={()=>setEditing(null)} />}
    </div>
  );
};

const ClassForm = ({ cls, onSave, onClose }: { cls: ClassSchedule; onSave: (c: ClassSchedule)=>void; onClose: ()=>void }) => {
  const [c, setC] = useState<ClassSchedule>(cls);
  const trainers = getTrainers().filter(t => t.active);
  const upd = (k: keyof ClassSchedule, v: any) => setC(x => ({ ...x, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); const t=trainers.find(x=>x.id===c.trainerId); if(!c.name.trim()||!t){alert('أدخل البيانات كاملة'); return;} onSave({...c, trainerName: t.name});}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{cls.name?'تعديل':'إضافة حصة'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <input value={c.name} onChange={e=>upd('name',e.target.value)} placeholder="اسم الحصة (Yoga, CrossFit...)" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <select value={c.trainerId} onChange={e=>upd('trainerId',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded font-cairo" required>
          <option value="">— اختر المدرب —</option>
          {trainers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>)}
        </select>
        <select value={c.dayOfWeek} onChange={e=>upd('dayOfWeek', Number(e.target.value))} className="w-full h-10 px-3 bg-secondary rounded font-cairo">
          {DAYS_AR.map((d,i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">من</label>
            <input type="time" value={c.startTime} onChange={e=>upd('startTime',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">إلى</label>
            <input type="time" value={c.endTime} onChange={e=>upd('endTime',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">السعة القصوى</label>
          <input type="number" value={c.capacity} onChange={e=>upd('capacity', Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
        </div>
        <textarea value={c.description||''} onChange={e=>upd('description',e.target.value)} placeholder="الوصف" className="w-full px-3 py-2 bg-secondary rounded min-h-[50px] font-cairo" />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={c.active} onChange={e=>upd('active',e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">الحصة نشطة</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

export default ClassesManager;
