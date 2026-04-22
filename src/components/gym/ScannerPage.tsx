// Scanner page: scans QR/barcode and registers attendance.
import { useState, useRef, useEffect } from 'react';
import { findMemberByCode, getActiveSubscription, addAttendance, getLastAttendanceForMember, getSettings, getStoreInfo, updateSubscription } from '@/lib/gymStore';
import { Member, Attendance, Subscription } from '@/types/gym';
import { ScanLine, Camera as CameraIcon, CheckCircle2, XCircle, User, Clock, AlertTriangle, Keyboard, CalendarOff } from 'lucide-react';
import CameraScanner from './CameraScanner';
import { fmtDate, todayISO } from '@/lib/format';

const DAY_NAMES = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

type ScanResult =
  | { kind: 'success'; member: Member; type: 'check-in'|'check-out'; subEnd: string; sessionsLeft?: number }
  | { kind: 'expired'; member: Member; subEnd: string }
  | { kind: 'no-sub'; member: Member }
  | { kind: 'frozen'; member: Member }
  | { kind: 'wrong-day'; member: Member; allowed: number[]; sub: Subscription }
  | { kind: 'no-sessions'; member: Member; sub: Subscription }
  | { kind: 'not-found'; code: string };

const ScannerPage = ({ staffName }: { staffName: string }) => {
  const settings = getSettings();
  const [mode, setMode] = useState<'scanner'|'camera'>(settings.scanMode === 'camera' ? 'camera' : 'scanner');
  const [input, setInput] = useState('');
  const [last, setLast] = useState<ScanResult | null>(null);
  const [recent, setRecent] = useState<Attendance[]>([]);
  const [override, setOverride] = useState<{ kind: 'wrong-day'|'no-sessions'; member: Member; sub: Subscription } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [mode]);

  const beep = (ok: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = ok ? 880 : 220;
      g.gain.value = 0.15;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  const recordAttendance = (member: Member, sub: Subscription | null, opts?: { note?: string }) => {
    const lastAtt = getLastAttendanceForMember(member.id);
    const today = todayISO();
    const isCheckIn = !lastAtt || lastAtt.date !== today || lastAtt.type === 'check-out';
    const att: Attendance = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      type: isCheckIn ? 'check-in' : 'check-out',
      timestamp: Date.now(),
      date: today,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      scannedBy: staffName,
      note: opts?.note,
    };
    addAttendance(att);
    setRecent(r => [att, ...r].slice(0, 10));

    let sessionsLeft: number | undefined;
    if (sub && isCheckIn && sub.sessionsTotal && sub.sessionsTotal > 0) {
      const used = (sub.sessionsUsed || 0) + 1;
      updateSubscription({ ...sub, sessionsUsed: used });
      sessionsLeft = Math.max(0, sub.sessionsTotal - used);
    }
    if (sub) {
      setLast({ kind: 'success', member, type: att.type, subEnd: sub.endDate, sessionsLeft });
    }
    beep(true);
  };

  const handleScan = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const member = findMemberByCode(code);
    if (!member) {
      setLast({ kind: 'not-found', code }); beep(false); return;
    }
    const sub = getActiveSubscription(member.id);
    if (!sub) { setLast({ kind: 'no-sub', member }); beep(false); return; }
    if (sub.status === 'frozen') { setLast({ kind: 'frozen', member }); beep(false); return; }
    if (sub.endDate < todayISO()) { setLast({ kind: 'expired', member, subEnd: sub.endDate }); beep(false); return; }

    const cur = getSettings();
    const today = new Date().getDay();

    // Allowed days check
    if (sub.allowedDays && sub.allowedDays.length > 0 && !sub.allowedDays.includes(today)) {
      if (cur.enforceAllowedDays) {
        setLast({ kind: 'wrong-day', member, allowed: sub.allowedDays, sub });
        beep(false);
        return;
      } else {
        setOverride({ kind: 'wrong-day', member, sub });
        beep(false);
        return;
      }
    }

    // Sessions check
    if (sub.sessionsTotal && sub.sessionsTotal > 0 && (sub.sessionsUsed || 0) >= sub.sessionsTotal) {
      if (cur.enforceSessions) {
        setLast({ kind: 'no-sessions', member, sub });
        beep(false);
        return;
      } else {
        setOverride({ kind: 'no-sessions', member, sub });
        beep(false);
        return;
      }
    }

    recordAttendance(member, sub);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(input);
    setInput('');
  };

  const approveOverride = () => {
    if (!override) return;
    const note = override.kind === 'wrong-day' ? 'دخول استثنائي خارج الأيام المسموحة' : 'دخول استثنائي بعد نفاد الحصص';
    recordAttendance(override.member, override.sub, { note });
    setOverride(null);
  };

  const denyOverride = () => {
    if (!override) return;
    if (override.kind === 'wrong-day') {
      setLast({ kind: 'wrong-day', member: override.member, allowed: override.sub.allowedDays || [], sub: override.sub });
    } else {
      setLast({ kind: 'no-sessions', member: override.member, sub: override.sub });
    }
    setOverride(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cairo font-black text-2xl flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" /> ماسح الدخول
          </h1>
          <div className="flex gap-1 bg-card p-1 rounded-lg border border-border">
            <button onClick={()=>setMode('scanner')} className={`px-3 py-1.5 rounded text-xs font-cairo font-bold flex items-center gap-1 ${mode==='scanner'?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>
              <Keyboard className="w-3.5 h-3.5" /> ماسح
            </button>
            <button onClick={()=>setMode('camera')} className={`px-3 py-1.5 rounded text-xs font-cairo font-bold flex items-center gap-1 ${mode==='camera'?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>
              <CameraIcon className="w-3.5 h-3.5" /> كاميرا
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            {mode === 'scanner' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="text-sm font-cairo text-muted-foreground">امسح بطاقة العضو أو أدخل الكود يدوياً</label>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e=>setInput(e.target.value)}
                  className="w-full h-16 px-4 text-center text-2xl font-mono font-black bg-secondary rounded-xl border-2 border-primary/30 focus:border-primary focus:outline-none tracking-wider"
                  placeholder="1001"
                  autoFocus
                />
                <button type="submit" className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">تسجيل</button>
              </form>
            ) : (
              <CameraScanner active={true} onScan={handleScan} />
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 min-h-[280px]">
            {!last && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground font-cairo">
                <ScanLine className="w-16 h-16 opacity-30 mb-2" />
                <p>في انتظار المسح...</p>
              </div>
            )}
            {last?.kind === 'success' && (
              <div className="text-center space-y-3 animate-pulse-glow rounded-xl p-3">
                <CheckCircle2 className="w-20 h-20 mx-auto text-success" />
                <div className="font-cairo font-black text-2xl text-success">
                  {last.type === 'check-in' ? 'دخول مسموح ✅' : 'تم تسجيل الخروج 👋'}
                </div>
                <div className="flex items-center justify-center gap-3">
                  {last.member.photo
                    ? <img src={last.member.photo} className="w-16 h-16 rounded-full object-cover border-2 border-success" alt="" />
                    : <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center"><User className="w-8 h-8" /></div>}
                  <div className="text-right">
                    <div className="font-cairo font-black text-lg">{last.member.name}</div>
                    <div className="font-mono text-primary text-sm">{last.member.code}</div>
                    <div className="text-xs text-muted-foreground font-cairo">ينتهي: {fmtDate(last.subEnd)}</div>
                    {typeof last.sessionsLeft === 'number' && (
                      <div className="text-xs font-cairo mt-1">
                        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary font-bold">
                          الحصص المتبقية: {last.sessionsLeft}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {last?.kind === 'expired' && (
              <ResultBox icon={<XCircle className="w-20 h-20 mx-auto text-destructive" />} title="الاشتراك منتهي" color="text-destructive" member={last.member} extra={`انتهى بتاريخ ${fmtDate(last.subEnd)}`} />
            )}
            {last?.kind === 'no-sub' && (
              <ResultBox icon={<AlertTriangle className="w-20 h-20 mx-auto text-warning" />} title="لا يوجد اشتراك نشط" color="text-warning" member={last.member} />
            )}
            {last?.kind === 'frozen' && (
              <ResultBox icon={<AlertTriangle className="w-20 h-20 mx-auto text-warning" />} title="الاشتراك مجمد" color="text-warning" member={last.member} extra="يجب استئناف الاشتراك أولاً" />
            )}
            {last?.kind === 'wrong-day' && (
              <ResultBox icon={<CalendarOff className="w-20 h-20 mx-auto text-destructive" />} title="غير مسموح اليوم" color="text-destructive" member={last.member} extra={`الأيام المسموحة: ${last.allowed.map(d=>DAY_NAMES[d]).join('، ')}`} />
            )}
            {last?.kind === 'no-sessions' && (
              <ResultBox icon={<XCircle className="w-20 h-20 mx-auto text-destructive" />} title="نفدت حصص الاشتراك" color="text-destructive" member={last.member} extra={`الحصص الكلية: ${last.sub.sessionsTotal}`} />
            )}
            {last?.kind === 'not-found' && (
              <div className="text-center space-y-3">
                <XCircle className="w-20 h-20 mx-auto text-destructive" />
                <div className="font-cairo font-black text-xl text-destructive">عضو غير موجود</div>
                <div className="font-mono text-sm text-muted-foreground">الكود: {last.code}</div>
              </div>
            )}
          </div>
        </div>

        {recent.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-cairo font-black mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> آخر الحضور</h3>
            <div className="space-y-1.5">
              {recent.map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-sm font-cairo">
                  <span><span className={`inline-block w-2 h-2 rounded-full ml-2 ${a.type==='check-in'?'bg-success':'bg-warning'}`}></span>{a.memberName}</span>
                  <span className="text-xs text-muted-foreground">{a.type==='check-in'?'دخول':'خروج'} • {a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Override dialog (cashier decision) */}
      {override && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border-2 border-warning p-6 max-w-md w-full space-y-4 shadow-glow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-warning" />
              <div>
                <h3 className="font-cairo font-black text-lg">تنبيه — قرار الكاشير</h3>
                <p className="text-xs text-muted-foreground font-cairo">
                  {override.kind === 'wrong-day' ? 'العضو غير مسموح له الدخول اليوم' : 'العضو نفدت حصصه'}
                </p>
              </div>
            </div>
            <div className="bg-secondary rounded-lg p-3 space-y-1">
              <div className="font-cairo font-black">{override.member.name}</div>
              <div className="font-mono text-primary text-sm">{override.member.code}</div>
              {override.kind === 'wrong-day' && override.sub.allowedDays && (
                <div className="text-xs text-muted-foreground font-cairo">
                  الأيام المسموحة: {override.sub.allowedDays.map(d=>DAY_NAMES[d]).join('، ')}
                </div>
              )}
              {override.kind === 'no-sessions' && (
                <div className="text-xs text-muted-foreground font-cairo">
                  استخدم {override.sub.sessionsUsed||0} من {override.sub.sessionsTotal} حصة
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={denyOverride} className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-cairo font-bold">رفض الدخول</button>
              <button onClick={approveOverride} className="flex-1 py-3 rounded-lg bg-success text-success-foreground font-cairo font-bold">السماح استثناءً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultBox = ({ icon, title, color, member, extra }: { icon: React.ReactNode; title: string; color: string; member: Member; extra?: string }) => (
  <div className="text-center space-y-3">
    {icon}
    <div className={`font-cairo font-black text-xl ${color}`}>{title}</div>
    <div className="flex items-center justify-center gap-3">
      {member.photo
        ? <img src={member.photo} className="w-14 h-14 rounded-full object-cover" alt="" />
        : <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"><User className="w-7 h-7" /></div>}
      <div className="text-right">
        <div className="font-cairo font-black">{member.name}</div>
        <div className="font-mono text-primary text-xs">{member.code}</div>
      </div>
    </div>
    {extra && <div className="text-sm text-muted-foreground font-cairo">{extra}</div>}
  </div>
);

export default ScannerPage;
