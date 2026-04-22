import { getMembers, getSubscriptions, getActiveSubscription, getTodayAttendance, getPayments, getExpenses, getSettings } from '@/lib/gymStore';
import { Users, UserCheck, Clock, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format';

const OverviewDashboard = () => {
  const members = getMembers();
  const subs = getSubscriptions();
  const today = todayISO();
  const settings = getSettings();

  const activeMembers = members.filter(m => {
    const s = getActiveSubscription(m.id);
    return s && s.status === 'active' && s.endDate >= today;
  });
  const expiredMembers = members.filter(m => {
    const s = getActiveSubscription(m.id);
    return !s || s.endDate < today;
  });
  const expiringSoon = subs.filter(s => {
    if (s.status !== 'active' || s.endDate < today) return false;
    const diff = Math.ceil((new Date(s.endDate).getTime() - new Date(today).getTime()) / 86400000);
    return diff > 0 && diff <= settings.expiryWarnDays;
  });

  const todayAtt = getTodayAttendance();
  const checkIns = todayAtt.filter(a=>a.type==='check-in').length;

  const todayPayments = getPayments().filter(p=>p.date===today).reduce((s,x)=>s+x.amount,0);
  const todayExpenses = getExpenses().filter(e=>e.date===today).reduce((s,x)=>s+x.amount,0);
  const monthPayments = getPayments().filter(p=>p.date.slice(0,7)===today.slice(0,7)).reduce((s,x)=>s+x.amount,0);

  const cards = [
    { label: 'إجمالي الأعضاء', value: members.length, sub: `${activeMembers.length} نشط`, color: 'bg-primary/15 text-primary', icon: <Users className="w-5 h-5" /> },
    { label: 'الأعضاء النشطون', value: activeMembers.length, sub: 'اشتراك ساري', color: 'bg-success/20 text-success', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'منتهي الاشتراك', value: expiredMembers.length, sub: 'يحتاج تجديد', color: 'bg-destructive/20 text-destructive', icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'دخول اليوم', value: checkIns, sub: `${todayAtt.length} عملية مسح`, color: 'bg-warning/20 text-warning', icon: <Clock className="w-5 h-5" /> },
    { label: 'إيراد اليوم', value: fmtCurrency(todayPayments), sub: '', color: 'bg-success/20 text-success', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'مصروفات اليوم', value: fmtCurrency(todayExpenses), sub: '', color: 'bg-destructive/20 text-destructive', icon: <TrendingDown className="w-5 h-5" /> },
    { label: '💰 إيراد الشهر', value: fmtCurrency(monthPayments), sub: today.slice(0,7), color: 'bg-primary/15 text-primary', icon: <DollarSign className="w-5 h-5" /> },
    { label: '⏰ ينتهي قريباً', value: expiringSoon.length, sub: `خلال ${settings.expiryWarnDays} يوم`, color: 'bg-warning/20 text-warning', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className={`p-4 rounded-xl ${c.color}`}>
            <div className="flex items-center gap-2 text-xs font-cairo opacity-90">{c.icon}{c.label}</div>
            <div className="font-cairo font-black text-2xl mt-2">{c.value}</div>
            {c.sub && <div className="text-xs opacity-70 mt-1 font-cairo">{c.sub}</div>}
          </div>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <div>
          <h3 className="font-cairo font-black text-base mb-2 text-warning">⏰ اشتراكات على وشك الانتهاء</h3>
          <div className="space-y-2">
            {expiringSoon.slice(0, 8).map(s => {
              const m = members.find(x => x.id === s.memberId);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="font-cairo">
                    <span className="font-bold">{m?.name}</span> <span className="font-mono text-xs text-primary">{m?.code}</span>
                  </div>
                  <div className="text-sm font-cairo text-warning">ينتهي {fmtDate(s.endDate)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-cairo font-black text-base mb-2">📋 آخر الحضور اليوم</h3>
        <div className="space-y-1.5">
          {todayAtt.slice().reverse().slice(0, 8).map(a => (
            <div key={a.id} className="flex items-center justify-between p-2.5 bg-card border border-border rounded font-cairo text-sm">
              <span><span className={`inline-block w-2 h-2 rounded-full ml-2 ${a.type==='check-in'?'bg-success':'bg-warning'}`}></span>{a.memberName}</span>
              <span className="text-xs text-muted-foreground">{a.type==='check-in'?'دخول':'خروج'} • {a.time}</span>
            </div>
          ))}
          {todayAtt.length === 0 && <div className="text-center text-muted-foreground py-6 font-cairo">لا حضور اليوم بعد.</div>}
        </div>
      </div>
    </div>
  );
};

export default OverviewDashboard;
