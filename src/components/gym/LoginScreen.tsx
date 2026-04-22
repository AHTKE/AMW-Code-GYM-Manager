// Login screen - admin or staff (reception)
import { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, AlertTriangle, Shield, ScanLine } from 'lucide-react';
import {
  isAdminSetup, verifyAdmin, verifyMasterRecovery, setAdminCredentials,
  verifyStaff, startStaffSession, getStoreInfo,
} from '@/lib/gymStore';
import { Staff } from '@/types/gym';
import gymLogo from '@/assets/gym-logo.png';
import CompanyCredits from '@/components/auth/CompanyCredits';

interface LoginScreenProps {
  onAdminSuccess: () => void;
  onStaffSuccess: (s: Staff) => void;
}

const LoginScreen = ({ onAdminSuccess, onStaffSuccess }: LoginScreenProps) => {
  const [tab, setTab] = useState<'admin'|'staff'>('admin');
  const store = getStoreInfo();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-y-auto gradient-dark">
      <div className="w-full max-w-md space-y-5 py-6">
        <div className="text-center space-y-2">
          <div className="w-32 h-32 mx-auto flex items-center justify-center">
            {store.logo
              ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
              : <img src={gymLogo} alt={store.name||'GYM'} className="w-full h-full object-contain drop-shadow-[0_0_24px_hsl(var(--primary)/0.5)]" />}
          </div>
          <h1 className="font-cairo font-black text-3xl tracking-wider bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {store.name || 'GYM'}
          </h1>
          <p className="font-cairo text-muted-foreground text-sm">نظام إدارة الجيم المتكامل</p>
        </div>

        <div className="flex gap-1 bg-card p-1 rounded-xl border border-border">
          <button onClick={()=>setTab('admin')} className={`flex-1 py-2.5 rounded-lg font-cairo font-bold text-sm flex items-center justify-center gap-2 transition ${tab==='admin'?'bg-primary text-primary-foreground shadow-glow':'text-muted-foreground'}`}>
            <Shield className="w-4 h-4" /> المدير
          </button>
          <button onClick={()=>setTab('staff')} className={`flex-1 py-2.5 rounded-lg font-cairo font-bold text-sm flex items-center justify-center gap-2 transition ${tab==='staff'?'bg-primary text-primary-foreground shadow-glow':'text-muted-foreground'}`}>
            <ScanLine className="w-4 h-4" /> موظف الاستقبال
          </button>
        </div>

        {tab === 'admin' ? <AdminForm onSuccess={onAdminSuccess} /> : <StaffForm onSuccess={onStaffSuccess} />}

        <CompanyCredits />
      </div>
    </div>
  );
};

const AdminForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const setup = !isAdminSetup();
  const [mode, setMode] = useState<'login'|'setup'|'recovery'>(setup ? 'setup' : 'login');
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [c, setC] = useState('');
  const [show, setShow] = useState(false); const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (mode==='setup') {
      if (!u.trim()||!p.trim()) return setErr('أدخل كل البيانات');
      if (p !== c) return setErr('كلمتا المرور غير متطابقتين');
      if (p.length < 4) return setErr('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      setAdminCredentials({ username: u.trim(), password: p.trim() });
      onSuccess();
    } else if (mode==='login') {
      if (verifyAdmin(u.trim(), p.trim())) onSuccess();
      else setErr('بيانات الدخول غير صحيحة');
    } else {
      if (verifyMasterRecovery(u.trim(), p.trim())) {
        setMode('setup'); setU(''); setP(''); setC(''); setErr('تم الاسترداد. أدخل بيانات جديدة.');
      } else setErr('بيانات الاسترداد غير صحيحة');
    }
  };

  return (
    <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-card">
      <h2 className="font-cairo font-black text-center text-lg">
        {mode==='setup'?'🔐 إعداد حساب المدير': mode==='recovery'?'🔑 استرداد كلمة المرور':'🔐 دخول المدير'}
      </h2>
      {err && <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs font-cairo"><AlertTriangle className="w-4 h-4" />{err}</div>}
      <input value={u} onChange={e=>setU(e.target.value)} placeholder="اسم المستخدم" className="w-full h-11 px-3 bg-secondary rounded-lg font-cairo focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
      <div className="relative">
        <input type={show?'text':'password'} value={p} onChange={e=>setP(e.target.value)} placeholder="كلمة المرور" className="w-full h-11 px-3 pl-10 bg-secondary rounded-lg font-cairo focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="button" onClick={()=>setShow(!show)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show?<EyeOff className="w-4 h-4" />:<Eye className="w-4 h-4" />}</button>
      </div>
      {mode==='setup' && <input type={show?'text':'password'} value={c} onChange={e=>setC(e.target.value)} placeholder="تأكيد كلمة المرور" className="w-full h-11 px-3 bg-secondary rounded-lg font-cairo focus:outline-none focus:ring-2 focus:ring-primary" />}
      <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow hover:opacity-90">
        {mode==='setup'?'إنشاء الحساب': mode==='recovery'?'استرداد':'دخول'}
      </button>
      {mode==='login' && <button type="button" onClick={()=>{setMode('recovery'); setU(''); setP(''); setErr('');}} className="w-full text-xs text-destructive font-cairo">نسيت كلمة المرور</button>}
      {mode==='recovery' && <button type="button" onClick={()=>{setMode('login'); setU(''); setP(''); setErr('');}} className="w-full text-xs text-muted-foreground font-cairo">رجوع لتسجيل الدخول</button>}
    </form>
  );
};

const StaffForm = ({ onSuccess }: { onSuccess: (s: Staff) => void }) => {
  const [code, setCode] = useState(''); const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = verifyStaff(code.trim(), pwd.trim());
    if (!s) { setErr('بيانات غير صحيحة أو الحساب معطل'); return; }
    startStaffSession(s);
    onSuccess(s);
  };
  return (
    <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-card">
      <h2 className="font-cairo font-black text-center text-lg">دخول موظف الاستقبال</h2>
      {err && <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-xs font-cairo"><AlertTriangle className="w-4 h-4" />{err}</div>}
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="كود الدخول" className="w-full h-11 px-3 bg-secondary rounded-lg font-cairo focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
      <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="كلمة المرور" className="w-full h-11 px-3 bg-secondary rounded-lg font-cairo focus:outline-none focus:ring-2 focus:ring-primary" />
      <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow hover:opacity-90">دخول</button>
      <p className="text-[11px] text-muted-foreground text-center font-cairo">يقوم المدير بإنشاء حسابات الموظفين من لوحة التحكم.</p>
    </form>
  );
};

export default LoginScreen;
