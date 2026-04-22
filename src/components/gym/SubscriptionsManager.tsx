import { useState, useMemo, useEffect } from 'react';
import {
  getMembers, getPlans, getSubscriptions, addSubscription, updateSubscription,
  deleteSubscription, addPayment, addIncome, findCoupon, consumeCoupon, getActiveOffers,
} from '@/lib/gymStore';
import { Member, Plan, Subscription, PaymentMethod } from '@/types/gym';
import { Plus, X, Search, Snowflake, Play, RotateCcw, Trash2, Receipt, Tag, CalendarDays } from 'lucide-react';
import { DaysSelector } from './PlansManager';
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format';

const SubscriptionsManager = () => {
  const [subs, setSubs] = useState<Subscription[]>(getSubscriptions());
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'frozen'>('all');

  const refresh = () => setSubs(getSubscriptions());
  const members = getMembers();

  const filtered = useMemo(() => {
    const today = todayISO();
    const q = search.trim().toLowerCase();
    return subs
      .map(s => ({ s, m: members.find(m => m.id === s.memberId) }))
      .filter(({ s, m }) => {
        if (q && !`${m?.name||''} ${m?.code||''} ${s.planName}`.toLowerCase().includes(q)) return false;
        if (filter === 'active') return s.status === 'active' && s.endDate >= today;
        if (filter === 'expired') return s.status !== 'cancelled' && s.endDate < today;
        if (filter === 'frozen') return s.status === 'frozen';
        return true;
      })
      .sort((a, b) => b.s.createdAt - a.s.createdAt);
  }, [subs, search, filter, members]);

  const today = todayISO();

  const renew = (s: Subscription) => {
    const member = members.find(m => m.id === s.memberId);
    if (!member) return;
    const plan = getPlans().find(p => p.id === s.planId);
    if (!plan) { alert('الباقة لم تعد موجودة'); return; }
    setShowNew(true);
    setTimeout(() => {
      const ev = new CustomEvent('gym-prefill-sub', { detail: { memberId: s.memberId, planId: plan.id } });
      window.dispatchEvent(ev);
    }, 0);
  };

  const freeze = (s: Subscription) => {
    if (s.status !== 'active') return;
    if (!confirm('تجميد الاشتراك؟ يمكن استئنافه لاحقاً وسيُمدد بعدد أيام التجميد.')) return;
    updateSubscription({ ...s, status: 'frozen', freezeStart: todayISO() });
    refresh();
  };

  const unfreeze = (s: Subscription) => {
    if (s.status !== 'frozen' || !s.freezeStart) return;
    const days = Math.ceil((Date.now() - new Date(s.freezeStart).getTime()) / 86400000);
    const newEnd = new Date(s.endDate); newEnd.setDate(newEnd.getDate() + days);
    updateSubscription({
      ...s, status: 'active',
      endDate: newEnd.toISOString().slice(0,10),
      freezeStart: undefined,
      freezeDays: (s.freezeDays||0) + days,
    });
    refresh();
  };

  const remove = (id: string) => { if (confirm('حذف الاشتراك نهائياً؟')) { deleteSubscription(id); refresh(); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم، الكود، أو الباقة..." className="w-full h-10 pr-10 px-3 bg-secondary rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-1">
          {(['all','active','expired','frozen'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 h-10 rounded-lg font-cairo font-bold text-sm ${filter===f?'bg-primary text-primary-foreground':'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {f==='all'?'الكل':f==='active'?'نشط':f==='expired'?'منتهي':'مجمد'}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowNew(true)} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> اشتراك جديد
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm font-cairo">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-right px-3 py-2">العضو</th>
              <th className="text-right px-3 py-2">الباقة</th>
              <th className="text-right px-3 py-2">من</th>
              <th className="text-right px-3 py-2">إلى</th>
              <th className="text-right px-3 py-2">السعر</th>
              <th className="text-right px-3 py-2">الحالة</th>
              <th className="text-right px-3 py-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({s,m}) => {
              const expired = s.status !== 'cancelled' && s.endDate < today;
              const isFrozen = s.status === 'frozen';
              const cancelled = s.status === 'cancelled';
              return (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-3 py-2">
                    <div className="font-bold">{m?.name || '—'}</div>
                    <div className="font-mono text-xs text-primary">{m?.code}</div>
                  </td>
                  <td className="px-3 py-2">{s.planName}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(s.startDate)}</td>
                  <td className="px-3 py-2 text-xs">{fmtDate(s.endDate)}</td>
                  <td className="px-3 py-2 font-bold">{fmtCurrency(s.price)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                      cancelled ? 'bg-destructive/20 text-destructive'
                        : isFrozen ? 'bg-warning/20 text-warning'
                        : expired ? 'bg-destructive/20 text-destructive'
                        : 'bg-success/20 text-success'
                    }`}>
                      {cancelled ? 'ملغي' : isFrozen ? '🥶 مجمد' : expired ? '⛔ منتهي' : '✓ نشط'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button title="تجديد" onClick={()=>renew(s)} className="p-1.5 rounded bg-secondary hover:bg-accent"><RotateCcw className="w-3.5 h-3.5" /></button>
                      {s.status === 'active' && <button title="تجميد" onClick={()=>freeze(s)} className="p-1.5 rounded bg-warning/20 text-warning hover:bg-warning/30"><Snowflake className="w-3.5 h-3.5" /></button>}
                      {s.status === 'frozen' && <button title="استئناف" onClick={()=>unfreeze(s)} className="p-1.5 rounded bg-success/20 text-success hover:bg-success/30"><Play className="w-3.5 h-3.5" /></button>}
                      <button title="حذف" onClick={()=>remove(s.id)} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد اشتراكات.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && <NewSubscriptionForm onClose={()=>{setShowNew(false); refresh();}} />}
    </div>
  );
};

const NewSubscriptionForm = ({ onClose }: { onClose: () => void }) => {
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [start, setStart] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paid, setPaid] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [allowedDays, setAllowedDays] = useState<number[]>([]);

  const members = getMembers();
  const plans = getPlans().filter(p => p.active);

  // Listen for prefill from renew action
  useState(() => {
    const handler = (e: any) => {
      if (e.detail?.memberId) setMemberId(e.detail.memberId);
      if (e.detail?.planId) setPlanId(e.detail.planId);
    };
    window.addEventListener('gym-prefill-sub', handler);
    return () => window.removeEventListener('gym-prefill-sub', handler);
  });

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members.filter(m => `${m.name} ${m.phone} ${m.code}`.toLowerCase().includes(q)).slice(0, 8);
  }, [memberSearch, members]);

  const plan = plans.find(p => p.id === planId);
  const member = members.find(m => m.id === memberId);
  const offers = getActiveOffers();
  const planOffer = plan ? offers.find(o => !o.appliesToPlanIds?.length || o.appliesToPlanIds.includes(plan.id)) : null;

  // sync sessions/days defaults when plan changes
  useEffect(() => {
    if (plan) {
      setSessionsTotal(plan.sessionsTotal || 0);
      setAllowedDays(plan.allowedDays || []);
    }
  }, [planId]);

  const subtotal = plan?.price || 0;
  const offerDiscount = planOffer
    ? planOffer.discountType === 'percent' ? Math.round(subtotal * planOffer.discountValue / 100) : planOffer.discountValue
    : 0;
  const total = Math.max(0, subtotal - offerDiscount - discount);
  const endDate = plan ? (() => { const d = new Date(start); d.setDate(d.getDate() + plan.durationDays); return d.toISOString().slice(0,10); })() : '';

  const applyCoupon = () => {
    setCouponMsg('');
    if (!couponCode.trim()) { setDiscount(0); return; }
    const c = findCoupon(couponCode);
    if (!c) { setCouponMsg('❌ الكوبون غير موجود'); setDiscount(0); return; }
    if (c.expiresAt && c.expiresAt < todayISO()) { setCouponMsg('❌ الكوبون منتهي'); setDiscount(0); return; }
    if (c.maxUses > 0 && c.usedCount >= c.maxUses) { setCouponMsg('❌ نفذت استخدامات الكوبون'); setDiscount(0); return; }
    const d = c.discountType === 'percent' ? Math.round(subtotal * c.discountValue / 100) : c.discountValue;
    setDiscount(d);
    setCouponMsg(`✓ تم تطبيق الكوبون - خصم ${fmtCurrency(d)}`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !plan) { alert('اختر العضو والباقة'); return; }
    const sub: Subscription = {
      id: crypto.randomUUID(),
      memberId: member.id,
      planId: plan.id,
      planName: plan.name,
      startDate: start,
      endDate,
      price: total,
      paid,
      paymentMethod,
      status: 'active',
      notes,
      couponCode: couponCode || undefined,
      discount: offerDiscount + discount,
      sessionsTotal: sessionsTotal || undefined,
      sessionsUsed: 0,
      allowedDays: allowedDays.length ? allowedDays : undefined,
      createdAt: Date.now(),
    };
    addSubscription(sub);
    if (paid > 0) {
      addPayment({
        id: crypto.randomUUID(), subscriptionId: sub.id, memberId: member.id, memberName: member.name,
        amount: paid, method: paymentMethod, date: todayISO(), timestamp: Date.now(),
        note: `اشتراك ${plan.name}`,
      });
      addIncome({
        id: crypto.randomUUID(), description: `اشتراك ${plan.name} - ${member.name}`,
        amount: paid, category: 'اشتراكات', date: todayISO(), timestamp: Date.now(),
      });
    }
    if (couponCode && discount > 0) consumeCoupon(couponCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-6 max-w-2xl w-full space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">اشتراك جديد</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="text-xs font-cairo text-muted-foreground">العضو *</label>
          {!memberId ? (
            <>
              <input value={memberSearch} onChange={e=>setMemberSearch(e.target.value)} placeholder="ابحث بالاسم أو الكود..." className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
              <div className="mt-2 max-h-40 overflow-y-auto bg-secondary/30 rounded">
                {filteredMembers.map(m => (
                  <button type="button" key={m.id} onClick={()=>setMemberId(m.id)} className="w-full text-right px-3 py-2 hover:bg-secondary border-b border-border last:border-0">
                    <div className="font-bold font-cairo text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground"><span className="text-primary font-mono">{m.code}</span> • {m.phone}</div>
                  </button>
                ))}
                {filteredMembers.length === 0 && <div className="text-xs text-muted-foreground text-center py-4 font-cairo">لا يوجد أعضاء</div>}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between mt-1 p-3 bg-secondary rounded">
              <div>
                <div className="font-bold font-cairo">{member?.name}</div>
                <div className="text-xs text-primary font-mono">{member?.code}</div>
              </div>
              <button type="button" onClick={()=>{setMemberId(''); setMemberSearch('');}} className="text-xs text-destructive font-cairo">تغيير</button>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-cairo text-muted-foreground">الباقة *</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {plans.map(p => (
              <button type="button" key={p.id} onClick={()=>setPlanId(p.id)} className={`p-3 rounded-lg border-2 text-right transition ${planId===p.id?'border-primary bg-primary/10':'border-border bg-secondary hover:border-primary/50'}`}>
                <div className="font-cairo font-bold">{p.name}</div>
                <div className="text-xs" style={{color: p.color}}>{fmtCurrency(p.price)} • {p.durationDays} يوم</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-cairo text-muted-foreground">تاريخ البدء</label>
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs font-cairo text-muted-foreground">تاريخ الانتهاء</label>
            <input value={endDate ? fmtDate(endDate) : '—'} disabled className="w-full h-10 px-3 bg-secondary/50 rounded mt-1 font-cairo opacity-60" />
          </div>
        </div>

        <div className="bg-secondary/20 rounded-lg p-3 space-y-3 border border-border">
          <div className="flex items-center gap-2 text-sm font-cairo font-bold">
            <CalendarDays className="w-4 h-4 text-primary" /> خصائص الاشتراك
          </div>
          <div>
            <label className="text-xs font-cairo text-muted-foreground">عدد الحصص (0 = غير محدود)</label>
            <input type="number" min={0} value={sessionsTotal} onChange={e=>setSessionsTotal(Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs font-cairo text-muted-foreground block mb-1">الأيام المسموح فيها (لو فاضي = كل الأيام)</label>
            <DaysSelector value={allowedDays} onChange={setAllowedDays} />
          </div>
        </div>

        <div>
          <label className="text-xs font-cairo text-muted-foreground">كود كوبون (اختياري)</label>
          <div className="flex gap-2 mt-1">
            <input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase()); setDiscount(0); setCouponMsg('');}} className="flex-1 h-10 px-3 bg-secondary rounded font-mono uppercase" placeholder="GYM2025" />
            <button type="button" onClick={applyCoupon} className="px-4 h-10 rounded bg-secondary hover:bg-accent font-cairo font-bold text-sm flex items-center gap-1">
              <Tag className="w-4 h-4" /> تطبيق
            </button>
          </div>
          {couponMsg && <div className="text-xs mt-1 font-cairo">{couponMsg}</div>}
        </div>

        {plan && (
          <div className="bg-secondary/30 rounded-lg p-4 space-y-1.5 font-cairo text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">سعر الباقة:</span> <span>{fmtCurrency(subtotal)}</span></div>
            {offerDiscount > 0 && <div className="flex justify-between text-success"><span>🎁 عرض ({planOffer?.title}):</span> <span>- {fmtCurrency(offerDiscount)}</span></div>}
            {discount > 0 && <div className="flex justify-between text-success"><span>🎫 خصم كوبون:</span> <span>- {fmtCurrency(discount)}</span></div>}
            <div className="flex justify-between text-lg font-black border-t border-border pt-2 mt-2"><span>الإجمالي:</span> <span className="text-primary">{fmtCurrency(total)}</span></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-cairo text-muted-foreground">المبلغ المدفوع</label>
            <input type="number" value={paid} onChange={e=>setPaid(Number(e.target.value)||0)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo" />
          </div>
          <div>
            <label className="text-xs font-cairo text-muted-foreground">طريقة الدفع</label>
            <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as PaymentMethod)} className="w-full h-10 px-3 bg-secondary rounded mt-1 font-cairo">
              <option value="cash">كاش</option>
              <option value="card">بطاقة</option>
              <option value="transfer">تحويل بنكي</option>
              <option value="wallet">محفظة إلكترونية</option>
            </select>
          </div>
        </div>

        <button type="button" onClick={()=>setPaid(total)} className="text-xs text-primary font-cairo">دفع المبلغ كامل ({fmtCurrency(total)})</button>

        <div>
          <label className="text-xs font-cairo text-muted-foreground">ملاحظات</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full px-3 py-2 bg-secondary rounded mt-1 min-h-[50px] font-cairo" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow flex items-center gap-2">
            <Receipt className="w-4 h-4" /> حفظ الاشتراك
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubscriptionsManager;
