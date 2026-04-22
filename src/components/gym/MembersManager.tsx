import { useState, useMemo, useRef } from 'react';
import {
  getMembers, addMember as storeAdd, updateMember, deleteMember,
  nextMemberCode, getActiveSubscription, getMemberSubscriptions,
} from '@/lib/gymStore';
import { Member } from '@/types/gym';
import { Plus, Search, Edit, Trash2, IdCard, X, Camera, User } from 'lucide-react';
import MembershipCard from './MembershipCard';
import { fmtDate } from '@/lib/format';

const blank = (): Member => ({
  id: crypto.randomUUID(),
  code: nextMemberCode(),
  name: '',
  phone: '',
  gender: 'male',
  joinedAt: Date.now(),
  active: true,
});

const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>(getMembers());
  const [editing, setEditing] = useState<Member | null>(null);
  const [showCard, setShowCard] = useState<Member | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const refresh = () => setMembers(getMembers());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter(m => {
      if (q && !`${m.name} ${m.phone} ${m.code}`.toLowerCase().includes(q)) return false;
      if (filter === 'all') return true;
      const sub = getActiveSubscription(m.id);
      if (filter === 'active') return !!sub && sub.status === 'active' && sub.endDate >= new Date().toISOString().slice(0,10);
      if (filter === 'expired') return !sub || sub.endDate < new Date().toISOString().slice(0,10);
      return true;
    });
  }, [members, search, filter]);

  const handleSave = (m: Member) => {
    if (members.some(x => x.id === m.id)) updateMember(m);
    else storeAdd(m);
    refresh();
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف هذا العضو وكل بياناته؟')) return;
    deleteMember(id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، أو كود العضو..."
            className="w-full h-10 pr-10 px-3 bg-secondary rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {(['all','active','expired'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 h-10 rounded-lg font-cairo font-bold text-sm transition ${filter===f?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {f==='all'?'الكل':f==='active'?'نشط':'منتهي'}
            </button>
          ))}
        </div>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm hover:opacity-90 shadow-glow">
          <Plus className="w-4 h-4" /> عضو جديد
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => {
          const sub = getActiveSubscription(m.id);
          const expired = !sub || sub.endDate < new Date().toISOString().slice(0,10);
          return (
            <div key={m.id} className="p-4 bg-card rounded-xl border border-border space-y-2 hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                  {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : <User className="w-7 h-7 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-cairo font-black text-base truncate">{m.name || '—'}</span>
                  </div>
                  <div className="font-mono text-xs text-primary font-bold tracking-wider">{m.code}</div>
                  <div className="text-xs text-muted-foreground">{m.phone || '—'}</div>
                </div>
              </div>
              <div className={`text-xs font-cairo px-2 py-1 rounded ${
                sub && !expired
                  ? sub.status === 'frozen'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {sub
                  ? sub.status === 'frozen'
                    ? `🥶 مجمد - ${sub.planName}`
                    : expired ? `⛔ منتهي - ${sub.planName}` : `✓ ${sub.planName} حتى ${fmtDate(sub.endDate)}`
                  : '⛔ لا يوجد اشتراك'}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowCard(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold">
                  <IdCard className="w-3.5 h-3.5" /> البطاقة
                </button>
                <button onClick={() => setEditing(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold">
                  <Edit className="w-3.5 h-3.5" /> تعديل
                </button>
                <button onClick={() => handleDelete(m.id)} className="px-3 py-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12 font-cairo">لا يوجد أعضاء يطابقون البحث.</div>
        )}
      </div>

      {editing && <MemberForm member={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
      {showCard && <MembershipCard member={showCard} onClose={() => setShowCard(null)} />}
    </div>
  );
};

interface FormProps { member: Member; onSave: (m: Member) => void; onClose: () => void; }
const MemberForm = ({ member, onSave, onClose }: FormProps) => {
  const [m, setM] = useState<Member>(member);
  const fileRef = useRef<HTMLInputElement>(null);

  const upd = (k: keyof Member, v: any) => setM(prev => ({ ...prev, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => upd('photo', reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!m.name.trim() || !m.phone.trim()) { alert('الاسم ورقم الهاتف مطلوبان'); return; }
    onSave(m);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 max-w-2xl w-full space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{member.name ? `تعديل: ${member.name}` : 'إضافة عضو جديد'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center border-2 border-border flex-shrink-0">
            {m.photo ? <img src={m.photo} className="w-full h-full object-cover" alt="" /> : <User className="w-12 h-12 text-muted-foreground" />}
          </div>
          <div className="flex-1 space-y-2">
            <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handlePhoto} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent font-cairo font-bold text-sm">
              <Camera className="w-4 h-4" /> {m.photo ? 'تغيير الصورة' : 'إضافة صورة'}
            </button>
            {m.photo && <button type="button" onClick={() => upd('photo', undefined)} className="text-xs text-destructive font-cairo">حذف الصورة</button>}
          </div>
          <div className="text-left">
            <div className="text-xs text-muted-foreground font-cairo">كود العضو</div>
            <div className="font-mono font-black text-primary text-lg">{m.code}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم *"><input value={m.name} onChange={e=>upd('name',e.target.value)} className="input" required /></Field>
          <Field label="الهاتف *"><input value={m.phone} onChange={e=>upd('phone',e.target.value)} className="input" required /></Field>
          <Field label="البريد الإلكتروني"><input type="email" value={m.email||''} onChange={e=>upd('email',e.target.value)} className="input" /></Field>
          <Field label="النوع">
            <select value={m.gender} onChange={e=>upd('gender', e.target.value as any)} className="input">
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
          <Field label="تاريخ الميلاد"><input type="date" value={m.birthDate||''} onChange={e=>upd('birthDate',e.target.value)} className="input" /></Field>
          <Field label="رقم الطوارئ"><input value={m.emergencyContact||''} onChange={e=>upd('emergencyContact',e.target.value)} className="input" /></Field>
          <Field label="الطول (سم)"><input type="number" value={m.height||''} onChange={e=>upd('height', Number(e.target.value)||undefined)} className="input" /></Field>
          <Field label="الوزن (كجم)"><input type="number" value={m.weight||''} onChange={e=>upd('weight', Number(e.target.value)||undefined)} className="input" /></Field>
          <Field label="العنوان" full><input value={m.address||''} onChange={e=>upd('address',e.target.value)} className="input" /></Field>
          <Field label="الأهداف" full><textarea value={m.goals||''} onChange={e=>upd('goals',e.target.value)} className="input min-h-[60px]" /></Field>
          <Field label="حالات طبية / ملاحظات صحية" full><textarea value={m.medicalConditions||''} onChange={e=>upd('medicalConditions',e.target.value)} className="input min-h-[60px]" /></Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary text-muted-foreground font-cairo font-bold hover:text-foreground">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold hover:opacity-90 shadow-glow">حفظ</button>
        </div>

        <style>{`.input{width:100%;height:40px;padding:0 12px;background:hsl(var(--secondary));border-radius:8px;font-family:'Cairo',sans-serif;font-size:14px;outline:none;border:1px solid transparent;color:hsl(var(--foreground));}
        .input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 2px hsl(var(--primary)/0.2);}
        textarea.input{padding:8px 12px;height:auto;resize:vertical;}`}</style>
      </form>
    </div>
  );
};

const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <label className="block text-xs font-cairo text-muted-foreground mb-1">{label}</label>
    {children}
  </div>
);

export default MembersManager;
