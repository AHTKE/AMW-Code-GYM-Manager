// Mandatory close-shift dialog shown when staff tries to logout.
// Shows a full summary of what they did during the shift.
import { useState } from 'react';
import { X, LogOut, DollarSign, Users, Activity, ScanLine, Clock } from 'lucide-react';
import { Shift, computeShiftSummary, formatDuration, closeShift } from '@/lib/shifts';
import { getStoreInfo } from '@/lib/gymStore';

interface Props {
  shift: Shift;
  showRevenue: boolean;
  showVisits: boolean;
  onClose: () => void;          // cancel close (keep working)
  onConfirmed: () => void;      // shift was closed → proceed with logout
}

const CloseShiftDialog = ({ shift, showRevenue, showVisits, onClose, onConfirmed }: Props) => {
  const [closingCash, setClosingCash] = useState<string>('');
  const [notes, setNotes] = useState('');
  const summary = computeShiftSummary(shift);
  const cur = getStoreInfo().currency;

  const handleConfirm = () => {
    closeShift(Number(closingCash) || 0, notes);
    onConfirmed();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl flex items-center gap-2">
            <LogOut className="w-5 h-5 text-destructive" /> إغلاق الوردية
          </h2>
          <button onClick={onClose} className="p-2 rounded hover:bg-secondary"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-secondary/40 rounded-xl p-3">
            <div className="text-xs text-muted-foreground font-cairo mb-1">الموظف</div>
            <div className="font-cairo font-black">{shift.staffName}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-cairo">
              <Clock className="w-3.5 h-3.5" />
              <span>بدأت: {new Date(shift.openedAt).toLocaleString('ar-EG')}</span>
            </div>
            <div className="text-xs text-muted-foreground font-cairo mt-1">المدة: {formatDuration(summary.durationMs)}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat icon={<Users className="w-4 h-4" />} label="أعضاء جدد" value={summary.membersAdded} />
            {showVisits && <Stat icon={<ScanLine className="w-4 h-4" />} label="زيارات/مسحات" value={summary.attendanceScans} />}
            <Stat icon={<Activity className="w-4 h-4" />} label="اشتراكات جديدة" value={summary.subscriptionsCreated} />
            <Stat icon={<DollarSign className="w-4 h-4" />} label="مدفوعات" value={summary.paymentsCount} />
          </div>

          {showRevenue && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-3 space-y-1">
              <div className="font-cairo font-black text-success text-sm">الإيرادات</div>
              <Row label="من الاشتراكات" value={`${summary.subscriptionsRevenue.toFixed(2)} ${cur}`} />
              <Row label="مدفوعات إضافية" value={`${summary.paymentsRevenue.toFixed(2)} ${cur}`} />
              <Row label="إيرادات أخرى" value={`${summary.incomeAmount.toFixed(2)} ${cur}`} />
              <Row label="مصروفات" value={`- ${summary.expensesAmount.toFixed(2)} ${cur}`} />
              <div className="border-t border-success/30 pt-1 mt-1">
                <Row label="صافي" value={`${summary.netCash.toFixed(2)} ${cur}`} bold />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-cairo">النقدية في الدرج عند الإغلاق</label>
            <input type="number" value={closingCash} onChange={e=>setClosingCash(e.target.value)}
              placeholder="0.00"
              className="w-full h-11 px-3 mt-1 bg-secondary rounded font-cairo" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-cairo">ملاحظات</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="اختياري..."
              className="w-full px-3 py-2 mt-1 bg-secondary rounded font-cairo text-sm min-h-[60px]" />
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg bg-secondary font-cairo font-bold">
            متابعة العمل
          </button>
          <button onClick={handleConfirm} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-cairo font-bold flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> إغلاق وخروج
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
  <div className="bg-secondary/40 rounded-lg p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-cairo">{icon}{label}</div>
    <div className="font-cairo font-black text-lg mt-1">{value}</div>
  </div>
);

const Row = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex items-center justify-between text-sm font-cairo ${bold ? 'font-black' : ''}`}>
    <span className="text-muted-foreground">{label}</span>
    <span>{value}</span>
  </div>
);

export default CloseShiftDialog;
