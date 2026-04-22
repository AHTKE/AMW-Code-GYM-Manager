// Admin tab: see all staff shifts with full details (sales, visits, duration).
import { useState, useMemo } from 'react';
import { getShifts, computeShiftSummary, formatDuration } from '@/lib/shifts';
import { getStoreInfo } from '@/lib/gymStore';
import { Clock, Users, Activity, ScanLine, DollarSign, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const ShiftsReport = () => {
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>(null);
  const cur = getStoreInfo().currency;

  const shifts = useMemo(() => {
    const list = getShifts().sort((a, b) => b.openedAt - a.openedAt);
    return staffFilter ? list.filter(s => s.staffName.toLowerCase().includes(staffFilter.toLowerCase())) : list;
  }, [staffFilter]);

  const totals = useMemo(() => {
    return shifts.reduce((acc, s) => {
      const sm = s.closeSummary || computeShiftSummary(s);
      acc.revenue += sm.subscriptionsRevenue + sm.paymentsRevenue + sm.incomeAmount;
      acc.expenses += sm.expensesAmount;
      acc.visits += sm.attendanceScans;
      acc.members += sm.membersAdded;
      return acc;
    }, { revenue: 0, expenses: 0, visits: 0, members: 0 });
  }, [shifts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SumCard label="إجمالي الإيرادات" value={`${totals.revenue.toFixed(2)} ${cur}`} color="text-success" />
        <SumCard label="إجمالي المصروفات" value={`${totals.expenses.toFixed(2)} ${cur}`} color="text-destructive" />
        <SumCard label="إجمالي الزيارات" value={String(totals.visits)} />
        <SumCard label="أعضاء جدد" value={String(totals.members)} />
      </div>

      <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
        <Filter className="w-4 h-4 text-muted-foreground mx-2" />
        <input value={staffFilter} onChange={e=>setStaffFilter(e.target.value)}
          placeholder="ابحث باسم الموظف..."
          className="flex-1 h-9 px-2 bg-secondary rounded font-cairo text-sm" />
      </div>

      <div className="space-y-2">
        {shifts.map(s => {
          const sm = s.closeSummary || computeShiftSummary(s);
          const isOpen = openId === s.id;
          const isActive = !s.closedAt;
          return (
            <div key={s.id} className="bg-card border border-border rounded-xl">
              <button onClick={()=>setOpenId(isOpen ? null : s.id)} className="w-full p-3 flex items-center gap-3 text-right">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground/40'}`} />
                <div className="flex-1">
                  <div className="font-cairo font-black">{s.staffName}</div>
                  <div className="text-xs text-muted-foreground font-cairo">
                    {new Date(s.openedAt).toLocaleString('ar-EG')}
                    {s.closedAt && ` ← ${new Date(s.closedAt).toLocaleString('ar-EG')}`}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground font-cairo">{formatDuration(sm.durationMs)}</div>
                  <div className="font-cairo font-black text-success text-sm">{(sm.subscriptionsRevenue + sm.paymentsRevenue).toFixed(0)} {cur}</div>
                </div>
                {isActive && <span className="text-[10px] px-2 py-0.5 rounded bg-success/20 text-success font-cairo">نشطة</span>}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isOpen && (
                <div className="border-t border-border p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat icon={<Clock />} label="المدة" value={formatDuration(sm.durationMs)} />
                  <Stat icon={<Users />} label="أعضاء جدد" value={sm.membersAdded} />
                  <Stat icon={<Activity />} label="اشتراكات" value={sm.subscriptionsCreated} />
                  <Stat icon={<ScanLine />} label="زيارات" value={sm.attendanceScans} />
                  <Stat icon={<DollarSign />} label="إيراد اشتراكات" value={`${sm.subscriptionsRevenue.toFixed(0)} ${cur}`} />
                  <Stat icon={<DollarSign />} label="مدفوعات" value={`${sm.paymentsRevenue.toFixed(0)} ${cur}`} />
                  <Stat icon={<DollarSign />} label="مصروفات" value={`${sm.expensesAmount.toFixed(0)} ${cur}`} />
                  <Stat icon={<DollarSign />} label="صافي" value={`${sm.netCash.toFixed(0)} ${cur}`} highlight />
                  {s.openingCash !== undefined && <Stat icon={<DollarSign />} label="درج البداية" value={`${s.openingCash.toFixed(0)} ${cur}`} />}
                  {s.closingCash !== undefined && <Stat icon={<DollarSign />} label="درج النهاية" value={`${s.closingCash.toFixed(0)} ${cur}`} />}
                  {s.notes && (
                    <div className="col-span-full text-xs font-cairo text-muted-foreground bg-secondary/40 rounded p-2">
                      📝 {s.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {shifts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Clock className="w-12 h-12 mx-auto opacity-30 mb-2" />
            لا توجد ورديات بعد.
          </div>
        )}
      </div>
    </div>
  );
};

const SumCard = ({ label, value, color = '' }: { label: string; value: string; color?: string }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <div className="text-xs text-muted-foreground font-cairo">{label}</div>
    <div className={`font-cairo font-black text-lg mt-1 ${color}`}>{value}</div>
  </div>
);

const Stat = ({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }) => (
  <div className={`rounded-lg p-2 ${highlight ? 'bg-success/15 border border-success/30' : 'bg-secondary/40'}`}>
    <div className="flex items-center gap-1 text-[10px] font-cairo text-muted-foreground">
      <span className="w-3 h-3 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>{label}
    </div>
    <div className="font-cairo font-black text-sm mt-0.5">{value}</div>
  </div>
);

export default ShiftsReport;
