import { useState } from 'react';
import { getOffers, addOffer, updateOffer, deleteOffer, getCoupons, addCoupon, updateCoupon, deleteCoupon, getPlans } from '@/lib/gymStore';
import { Offer, Coupon } from '@/types/gym';
import { Plus, Edit, Trash2, X, Gift, Tag } from 'lucide-react';
import { fmtDate, todayISO } from '@/lib/format';

const OffersAndCoupons = () => {
  const [tab, setTab] = useState<'offers' | 'coupons'>('offers');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={()=>setTab('offers')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-cairo font-bold text-sm ${tab==='offers'?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground'}`}>
          <Gift className="w-4 h-4" /> العروض
        </button>
        <button onClick={()=>setTab('coupons')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-cairo font-bold text-sm ${tab==='coupons'?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground'}`}>
          <Tag className="w-4 h-4" /> الكوبونات
        </button>
      </div>
      {tab==='offers' ? <Offers /> : <Coupons />}
    </div>
  );
};

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>(getOffers());
  const [editing, setEditing] = useState<Offer | null>(null);
  const refresh = () => setOffers(getOffers());
  const blank = (): Offer => ({
    id: crypto.randomUUID(), title: '', description: '', discountType: 'percent', discountValue: 10,
    startDate: todayISO(), endDate: todayISO(), active: true, createdAt: Date.now(),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={()=>setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> عرض جديد
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {offers.map(o => {
          const expired = o.endDate < todayISO();
          return (
            <div key={o.id} className={`p-4 rounded-xl border-2 ${o.active && !expired ? 'border-primary/50 bg-primary/5' : 'border-border bg-card opacity-70'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-cairo font-black text-lg">🎁 {o.title}</h3>
                  <div className="text-2xl font-black text-primary font-cairo">
                    {o.discountType === 'percent' ? `${o.discountValue}%` : `${o.discountValue} ج.م`} خصم
                  </div>
                </div>
                {expired && <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded font-cairo">منتهي</span>}
              </div>
              <p className="text-sm text-muted-foreground font-cairo mt-2">{o.description}</p>
              <div className="text-xs text-muted-foreground font-cairo mt-2">من {fmtDate(o.startDate)} إلى {fmtDate(o.endDate)}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>setEditing(o)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> تعديل</button>
                <button onClick={()=>{if(confirm('حذف العرض؟')){deleteOffer(o.id); refresh();}}} className="px-3 py-2 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          );
        })}
        {offers.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12 font-cairo">لا توجد عروض.</div>}
      </div>
      {editing && <OfferForm offer={editing} onSave={o=>{ if(offers.some(x=>x.id===o.id))updateOffer(o); else addOffer(o); refresh(); setEditing(null); }} onClose={()=>setEditing(null)} />}
    </div>
  );
};

const OfferForm = ({ offer, onSave, onClose }: { offer: Offer; onSave: (o: Offer)=>void; onClose: ()=>void }) => {
  const [o, setO] = useState<Offer>(offer);
  const plans = getPlans();
  const upd = (k: keyof Offer, v: any) => setO(x => ({ ...x, [k]: v }));
  const togglePlan = (id: string) => {
    const list = o.appliesToPlanIds || [];
    upd('appliesToPlanIds', list.includes(id) ? list.filter(x=>x!==id) : [...list, id]);
  };
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); if(!o.title.trim()){alert('أدخل العنوان'); return;} onSave(o);}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{offer.title?'تعديل العرض':'عرض جديد'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <input value={o.title} onChange={e=>upd('title',e.target.value)} placeholder="عنوان العرض *" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
        <textarea value={o.description} onChange={e=>upd('description',e.target.value)} placeholder="الوصف" className="w-full px-3 py-2 bg-secondary rounded min-h-[60px] font-cairo" />
        <div className="grid grid-cols-2 gap-3">
          <select value={o.discountType} onChange={e=>upd('discountType', e.target.value as any)} className="h-10 px-3 bg-secondary rounded font-cairo">
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
          <input type="number" value={o.discountValue} onChange={e=>upd('discountValue', Number(e.target.value)||0)} className="h-10 px-3 bg-secondary rounded font-cairo" placeholder="القيمة" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-cairo">من</label>
            <input type="date" value={o.startDate} onChange={e=>upd('startDate',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-cairo">إلى</label>
            <input type="date" value={o.endDate} onChange={e=>upd('endDate',e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">ينطبق على باقات محددة (اتركها فارغة = الكل)</label>
          <div className="grid grid-cols-2 gap-1.5 mt-1 max-h-40 overflow-y-auto">
            {plans.map(p => (
              <label key={p.id} className="flex items-center gap-2 p-2 bg-secondary rounded cursor-pointer text-xs font-cairo">
                <input type="checkbox" checked={o.appliesToPlanIds?.includes(p.id)||false} onChange={()=>togglePlan(p.id)} className="accent-primary" />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={o.active} onChange={e=>upd('active',e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">العرض نشط</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(getCoupons());
  const [editing, setEditing] = useState<Coupon | null>(null);
  const refresh = () => setCoupons(getCoupons());
  const blank = (): Coupon => ({
    id: crypto.randomUUID(), code: '', discountType: 'percent', discountValue: 10,
    maxUses: 0, usedCount: 0, active: true, createdAt: Date.now(),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={()=>setEditing(blank())} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> كوبون جديد
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {coupons.map(c => (
          <div key={c.id} className="p-4 bg-card rounded-xl border-2 border-dashed border-primary/40">
            <div className="font-mono text-2xl font-black text-primary tracking-wider">{c.code}</div>
            <div className="text-xl font-black font-cairo mt-1">
              {c.discountType==='percent'?`${c.discountValue}%`:`${c.discountValue} ج.م`} خصم
            </div>
            <div className="text-xs text-muted-foreground font-cairo mt-1">
              استُخدم {c.usedCount} من {c.maxUses === 0 ? '∞' : c.maxUses}
            </div>
            {c.expiresAt && <div className="text-xs text-muted-foreground font-cairo">ينتهي: {fmtDate(c.expiresAt)}</div>}
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setEditing(c)} className="flex-1 py-2 rounded bg-secondary hover:bg-accent text-xs font-cairo font-bold flex items-center justify-center gap-1"><Edit className="w-3 h-3" /> تعديل</button>
              <button onClick={()=>{if(confirm('حذف الكوبون؟')){deleteCoupon(c.id); refresh();}}} className="px-3 py-2 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12 font-cairo">لا توجد كوبونات.</div>}
      </div>
      {editing && <CouponForm coupon={editing} onSave={c=>{ if(coupons.some(x=>x.id===c.id))updateCoupon(c); else addCoupon(c); refresh(); setEditing(null); }} onClose={()=>setEditing(null)} />}
    </div>
  );
};

const CouponForm = ({ coupon, onSave, onClose }: { coupon: Coupon; onSave: (c: Coupon)=>void; onClose: ()=>void }) => {
  const [c, setC] = useState<Coupon>(coupon);
  const upd = (k: keyof Coupon, v: any) => setC(x => ({ ...x, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={e=>{e.preventDefault(); if(!c.code.trim()){alert('أدخل الكود'); return;} onSave({...c, code: c.code.toUpperCase()});}} className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">{coupon.code?'تعديل الكوبون':'كوبون جديد'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>
        <input value={c.code} onChange={e=>upd('code', e.target.value.toUpperCase())} placeholder="كود الكوبون (مثل: GYM2025)" className="w-full h-10 px-3 bg-secondary rounded font-mono uppercase" required />
        <div className="grid grid-cols-2 gap-3">
          <select value={c.discountType} onChange={e=>upd('discountType', e.target.value as any)} className="h-10 px-3 bg-secondary rounded font-cairo">
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
          <input type="number" value={c.discountValue} onChange={e=>upd('discountValue', Number(e.target.value)||0)} className="h-10 px-3 bg-secondary rounded font-cairo" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">عدد الاستخدامات الأقصى (0 = غير محدود)</label>
          <input type="number" value={c.maxUses} onChange={e=>upd('maxUses', Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-cairo">تاريخ الانتهاء (اختياري)</label>
          <input type="date" value={c.expiresAt||''} onChange={e=>upd('expiresAt', e.target.value || undefined)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={c.active} onChange={e=>upd('active', e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="font-cairo text-sm">الكوبون نشط</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
        </div>
      </form>
    </div>
  );
};

export default OffersAndCoupons;
