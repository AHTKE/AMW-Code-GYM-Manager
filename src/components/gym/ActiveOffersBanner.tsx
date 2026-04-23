// Banner that shows currently active offers and coupons to the receptionist
// on the scanner screen, so they immediately know what promotions are running.
import { useState, useEffect } from 'react';
import { Gift, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getOffers, getCoupons } from '@/lib/gymStore';
import { Offer, Coupon } from '@/types/gym';
import { todayISO } from '@/lib/format';

const ActiveOffersBanner = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = todayISO();
    setOffers(getOffers().filter(o => o.active && o.startDate <= today && o.endDate >= today));
    setCoupons(getCoupons().filter(c => c.active && (!c.expiresAt || c.expiresAt >= today)));
  }, []);

  const total = offers.length + coupons.length;
  if (total === 0 || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
      <div className="max-w-5xl mx-auto px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <button onClick={()=>setCollapsed(c=>!c)} className="flex items-center gap-2 text-sm font-cairo font-black text-primary">
            <Gift className="w-4 h-4" />
            <span>عروض وكوبونات نشطة ({total})</span>
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button onClick={()=>setDismissed(true)} className="p-1 rounded hover:bg-secondary text-muted-foreground" title="إخفاء">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {!collapsed && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {offers.map(o => (
              <span key={o.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-[11px] font-cairo font-bold text-primary">
                <Gift className="w-3 h-3" /> {o.title} — {o.discountType==='percent'?`${o.discountValue}%`:`${o.discountValue} خصم`}
              </span>
            ))}
            {coupons.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/15 border border-success/30 text-[11px] font-cairo font-bold text-success">
                <Tag className="w-3 h-3" /> {c.code} — {c.discountType==='percent'?`${c.discountValue}%`:`${c.discountValue} خصم`}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveOffersBanner;
