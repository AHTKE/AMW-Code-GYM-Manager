// Shift management for staff members.
// A shift starts when staff logs in and must be closed before they can log out.
// Tracks: open/close time, duration, sales (subscriptions/payments), members added,
// attendance scans, and finance entries — all attributed to the staff member.

import { Subscription, Payment, Member, Attendance, Income, Expense } from '@/types/gym';
import { getSubscriptions, getPayments, getMembers, getAttendance, getIncome, getExpenses } from '@/lib/gymStore';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: number;
  closedAt?: number;
  openingCash?: number;
  closingCash?: number;
  notes?: string;
  // snapshot counters at close (for quick admin viewing)
  closeSummary?: ShiftSummary;
}

export interface ShiftSummary {
  durationMs: number;
  subscriptionsCreated: number;
  subscriptionsRevenue: number;
  paymentsCount: number;
  paymentsRevenue: number;
  membersAdded: number;
  attendanceScans: number;
  expensesCount: number;
  expensesAmount: number;
  incomeCount: number;
  incomeAmount: number;
  netCash: number;
}

const KEY = 'gym_shifts';
const ACTIVE_KEY = 'gym_active_shift';

function load<T>(k: string, fb: T): T {
  try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; }
}
function save<T>(k: string, v: T) { localStorage.setItem(k, JSON.stringify(v)); }

export function getShifts(): Shift[] { return load<Shift[]>(KEY, []); }
export function saveShifts(list: Shift[]) { save(KEY, list); }

export function getActiveShift(): Shift | null {
  return load<Shift | null>(ACTIVE_KEY, null);
}

export function getActiveShiftFor(staffId: string): Shift | null {
  const a = getActiveShift();
  return a && a.staffId === staffId ? a : null;
}

export function openShift(staffId: string, staffName: string, openingCash = 0): Shift {
  const existing = getActiveShift();
  if (existing && existing.staffId === staffId) return existing;
  const shift: Shift = {
    id: crypto.randomUUID(),
    staffId, staffName,
    openedAt: Date.now(),
    openingCash,
  };
  const list = getShifts();
  list.push(shift);
  saveShifts(list);
  save(ACTIVE_KEY, shift);
  return shift;
}

export function closeShift(closingCash = 0, notes = ''): Shift | null {
  const active = getActiveShift();
  if (!active) return null;
  const summary = computeShiftSummary(active);
  const closed: Shift = {
    ...active,
    closedAt: Date.now(),
    closingCash,
    notes,
    closeSummary: summary,
  };
  const list = getShifts().map(s => s.id === closed.id ? closed : s);
  saveShifts(list);
  localStorage.removeItem(ACTIVE_KEY);
  return closed;
}

// Compute live or final summary for a shift
export function computeShiftSummary(shift: Shift): ShiftSummary {
  const start = shift.openedAt;
  const end = shift.closedAt ?? Date.now();
  const inRange = (t: number) => t >= start && t <= end;
  // Match by either staff id or staff name (some records save name only)
  const byStaff = (sid?: string) => !sid || sid === shift.staffId || sid === shift.staffName;

  const subs: Subscription[] = getSubscriptions().filter(s => inRange(s.createdAt) && byStaff(s.createdBy));
  const pays: Payment[] = getPayments().filter(p => inRange(p.timestamp) && byStaff(p.receivedBy));
  const members: Member[] = getMembers().filter(m => inRange(m.joinedAt));
  const att: Attendance[] = getAttendance().filter(a => inRange(a.timestamp) && byStaff(a.scannedBy));
  const inc: Income[] = getIncome().filter(i => inRange(i.timestamp));
  const exp: Expense[] = getExpenses().filter(e => inRange(e.timestamp));

  const subsRevenue = subs.reduce((a, s) => a + (s.paid || 0), 0);
  const paysRevenue = pays.reduce((a, p) => a + (p.amount || 0), 0);
  const incomeAmt = inc.reduce((a, i) => a + (i.amount || 0), 0);
  const expensesAmt = exp.reduce((a, e) => a + (e.amount || 0), 0);

  return {
    durationMs: end - start,
    subscriptionsCreated: subs.length,
    subscriptionsRevenue: subsRevenue,
    paymentsCount: pays.length,
    paymentsRevenue: paysRevenue,
    membersAdded: members.length,
    attendanceScans: att.length,
    expensesCount: exp.length,
    expensesAmount: expensesAmt,
    incomeCount: inc.length,
    incomeAmount: incomeAmt,
    netCash: subsRevenue + paysRevenue + incomeAmt - expensesAmt,
  };
}

export function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}س ${m}د`;
}

export function getStaffShifts(staffId: string): Shift[] {
  return getShifts().filter(s => s.staffId === staffId).sort((a, b) => b.openedAt - a.openedAt);
}
