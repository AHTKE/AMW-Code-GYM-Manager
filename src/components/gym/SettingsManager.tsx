import { useState, useRef } from 'react';
import { getStoreInfo, saveStoreInfo, getSettings, saveSettings, GymStoreInfo, GymSettings, getAdminCredentials, setAdminCredentials, CardDisplayOptions } from '@/lib/gymStore';
import { Save, Camera, IdCard } from 'lucide-react';
import ThemeAndShortcutsPanel from './ThemeAndShortcutsPanel';

const SettingsManager = () => {
  const [store, setStore] = useState<GymStoreInfo>(getStoreInfo());
  const [settings, setSettings] = useState<GymSettings>(getSettings());
  const [creds, setCreds] = useState({ username: getAdminCredentials()?.username || '', password: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setStore({...store, logo: r.result as string}); r.readAsDataURL(f);
  };

  const save = () => {
    saveStoreInfo(store);
    saveSettings(settings);
    if (creds.password) {
      if (creds.password !== creds.confirm) { alert('كلمتا المرور غير متطابقتين'); return; }
      setAdminCredentials({ username: creds.username, password: creds.password });
      setCreds({ ...creds, password: '', confirm: '' });
    }
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <ThemeAndShortcutsPanel />
      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-cairo font-black text-lg">🏋️ بيانات الجيم</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex items-center justify-center border border-border">
            {store.logo ? <img src={store.logo} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-muted-foreground font-cairo">لا يوجد</span>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          <button onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent font-cairo font-bold text-sm">
            <Camera className="w-4 h-4" /> {store.logo?'تغيير الشعار':'رفع شعار'}
          </button>
        </div>
        <Input label="اسم الجيم" value={store.name} onChange={v=>setStore({...store, name: v})} />
        <Input label="العنوان" value={store.address} onChange={v=>setStore({...store, address: v})} />
        <Input label="الهاتف" value={store.phone} onChange={v=>setStore({...store, phone: v})} />
        <Input label="البريد الإلكتروني" value={store.email} onChange={v=>setStore({...store, email: v})} />
        <Input label="رمز العملة" value={store.currency} onChange={v=>setStore({...store, currency: v})} />
      </section>

      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-cairo font-black text-lg">⚙️ إعدادات النظام</h3>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">طريقة المسح</label>
          <select value={settings.scanMode} onChange={e=>setSettings({...settings, scanMode: e.target.value as any})} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo">
            <option value="scanner">جهاز ماسح فقط</option>
            <option value="camera">كاميرا فقط</option>
            <option value="both">الاثنين</option>
          </select>
        </div>
        <Input label="تنبيه قبل انتهاء الاشتراك (أيام)" type="number" value={String(settings.expiryWarnDays)} onChange={v=>setSettings({...settings, expiryWarnDays: Number(v)||0})} />
        <Input label="خروج تلقائي بعد (ساعات) — 0 لتعطيل" type="number" value={String(settings.autoCheckOutHours)} onChange={v=>setSettings({...settings, autoCheckOutHours: Number(v)||0})} />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.printCardOnCreate} onChange={e=>setSettings({...settings, printCardOnCreate: e.target.checked})} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">طباعة البطاقة تلقائياً عند إنشاء عضو</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.enforceAllowedDays} onChange={e=>setSettings({...settings, enforceAllowedDays: e.target.checked})} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">رفض دخول العضو خارج الأيام المسموحة (بدون تأكيد كاشير)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.enforceSessions} onChange={e=>setSettings({...settings, enforceSessions: e.target.checked})} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">رفض دخول العضو بعد نفاد حصصه (بدون تأكيد كاشير)</span>
        </label>
      </section>

      <CardOptionsSection options={settings.cardOptions} onChange={c=>setSettings({...settings, cardOptions: c})} />

      <section className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-cairo font-black text-lg">🔐 حساب المدير</h3>
        <Input label="اسم المستخدم" value={creds.username} onChange={v=>setCreds({...creds, username: v})} />
        <Input label="كلمة مرور جديدة (اتركها فارغة لإبقائها)" type="password" value={creds.password} onChange={v=>setCreds({...creds, password: v})} />
        <Input label="تأكيد كلمة المرور" type="password" value={creds.confirm} onChange={v=>setCreds({...creds, confirm: v})} />
      </section>

      <button onClick={save} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">
        <Save className="w-4 h-4" /> {saved ? '✓ تم الحفظ' : 'حفظ كل الإعدادات'}
      </button>
    </div>
  );
};

const Input = ({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string)=>void; type?: string }) => (
  <div>
    <label className="text-xs text-muted-foreground font-cairo">{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
  </div>
);

const CARD_FIELD_LABELS: Record<keyof CardDisplayOptions, string> = {
  showSubscription: 'اسم الباقة',
  showPrice: 'سعر الاشتراك',
  showStartDate: 'تاريخ بداية الاشتراك',
  showEndDate: 'تاريخ انتهاء الاشتراك',
  showSessions: 'عدد الحصص (المستخدمة/الكلية)',
  showAllowedDays: 'الأيام المسموحة',
  showPhone: 'رقم الهاتف',
  showPhoto: 'صورة العضو',
  showQR: 'رمز QR',
  showBarcode: 'باركود',
  showFeatures: 'مميزات الباقة (تدريب شخصي، حصص..)',
  showJoinedDate: 'تاريخ الانضمام',
};

const CardOptionsSection = ({ options, onChange }: { options: CardDisplayOptions; onChange: (o: CardDisplayOptions) => void }) => (
  <section className="bg-card rounded-xl border border-border p-5 space-y-3">
    <h3 className="font-cairo font-black text-lg flex items-center gap-2">
      <IdCard className="w-5 h-5 text-primary" /> تخصيص بطاقة العضوية
    </h3>
    <p className="text-xs text-muted-foreground font-cairo">حدد الحقول التي تظهر على البطاقة المطبوعة وفي المعاينة.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {(Object.keys(CARD_FIELD_LABELS) as (keyof CardDisplayOptions)[]).map(k => (
        <label key={k} className="flex items-center gap-2 cursor-pointer p-2 rounded bg-secondary/40 hover:bg-secondary">
          <input
            type="checkbox"
            checked={options[k]}
            onChange={e=>onChange({ ...options, [k]: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span className="font-cairo text-sm">{CARD_FIELD_LABELS[k]}</span>
        </label>
      ))}
    </div>
  </section>
);

export default SettingsManager;
