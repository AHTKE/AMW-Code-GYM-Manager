import { useState } from 'react';
import { getStaff, addStaff, updateStaff, deleteStaff } from '@/lib/gymStore';
import { Staff } from '@/types/gym';
import { Plus, Edit, Trash2, X, Users, Shield } from 'lucide-react';
import StaffPermissionsEditor from './StaffPermissionsEditor';

const StaffManager = () => {
  const [staff, setStaff] = useState<Staff[]>(getStaff());
  const [editing, setEditing] = useState<Staff | null>(null);
  const [permsFor, setPermsFor] = useState<Staff | null>(null);
  const [bulkPerms, setBulkPerms] = useState(false);
  const refresh = () => setStaff(getStaff());

  const blank = (): Staff => ({
    id: crypto.randomUUID(), name: '', code: '', password: '', role: 'reception', active: true, createdAt: Date.now(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 flex-wrap">
        <button onClick={()=>setBulkPerms(true)} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary/15 text-primary font-cairo font-bold text-sm border border-primary/30">
          <Shield className="w-4 h-4" /> صلاحيات الكل
        </button>
        <button onClick={()=>setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> موظف جديد
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {staff.map(s => (
          <div key={s.id} className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-cairo font-black">{s.name}</div>
                <div className="font-mono text-xs text-primary">كود: {s.code}</div>
                <div className="text-xs text-muted-foreground font-cairo mt-1">{s.role==='reception'?'استقبال':s.role==='trainer'?'مدرب':'مدير'}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-cairo ${s.active?'bg-success/20 text-success':'bg-destructive/20 text-destructive'}`}>
                {s.active?'نشط':'معطل'}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setPermsFor(s)} title="الصلاحيات" className="flex-1 py-2 rounded bg-primary/15 text-primary text-xs font-cairo font-bold flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> الصلاحيات
              </button>
              <button onClick={()=>setEditing(s)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> تعديل</button>
              <button onClick={()=>{if(confirm('حذف الموظف؟')){deleteStaff(s.id); refresh();}}} className="px-3 py-2 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {staff.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12 font-cairo flex flex-col items-center gap-2"><Users className="w-12 h-12 opacity-30" /> لا يوجد موظفين بعد.</div>}
      </div>
      {editing && <Form staff={editing} onSave={s=>{ if(staff.some(x=>x.id===s.id))updateStaff(s); else addStaff(s); refresh(); setEditing(null); }} onClose={()=>setEditing(null)} />}
      {permsFor && <StaffPermissionsEditor staff={permsFor} onClose={()=>setPermsFor(null)} />}
      {bulkPerms && <StaffPermissionsEditor staff={null} onClose={()=>setBulkPerms(false)} />}
    </div>
  );
};

const Form = ({ staff, onSave, onClose }: { staff: Staff; onSave: (s: Staff)=>void; onClose: ()=>void }) => {
  const [s, setS] = useState<Staff>(staff);
  const upd = (k: keyof Staff, v: any) => setS(x => ({ ...x, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); if(!s.name.trim()||!s.code.trim()||!s.password.trim()){alert('أكمل البيانات'); return;} onSave(s);}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{staff.name?'تعديل':'موظف جديد'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <input value={s.name} onChange={e=>upd('name',e.target.value)} placeholder="الاسم *" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <input value={s.code} onChange={e=>upd('code',e.target.value)} placeholder="كود الدخول *" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <input value={s.password} onChange={e=>upd('password',e.target.value)} placeholder="كلمة المرور *" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <select value={s.role} onChange={e=>upd('role', e.target.value as any)} className="w-full h-10 px-3 bg-secondary rounded font-cairo">
          <option value="reception">استقبال</option>
          <option value="trainer">مدرب</option>
          <option value="manager">مدير</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={s.active} onChange={e=>upd('active', e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">الحساب نشط</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

export default StaffManager;
