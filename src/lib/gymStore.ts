// LocalStorage backend for the Gym app.
// All data is stored in localStorage so the app works fully offline (Electron).

import {
  Member, Plan, Subscription, Trainer, ClassSchedule, ClassBooking,
  Attendance, Offer, Coupon, Expense, Income, Payment,
  AdminCredentials, Staff, StaffSession,
} from '@/types/gym';

const KEYS = {
  members: 'gym_members',
  plans: 'gym_plans',
  subscriptions: 'gym_subscriptions',
  trainers: 'gym_trainers',
  classes: 'gym_classes',
  bookings: 'gym_bookings',
  attendance: 'gym_attendance',
  offers: 'gym_offers',
  coupons: 'gym_coupons',
  expenses: 'gym_expenses',
  income: 'gym_income',
  payments: 'gym_payments',
  adminCreds: 'gym_admin_creds',
  staff: 'gym_staff',
  staffSessions: 'gym_staff_sessions',
  activeStaffSession: 'gym_active_staff_session',
  storeInfo: 'gym_store_info',
  settings: 'gym_settings',
  memberCounter: 'gym_member_counter',
};

// Master recovery (fallback if admin forgets password)
const MASTER_RECOVERY = { username: 'Proofahmed', password: '24682468' };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Store info / settings ───
export interface GymStoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string; // data URL
  currency: string;
}
const DEFAULT_STORE_INFO: GymStoreInfo = {
  name: 'GYM',
  address: '',
  phone: '',
  email: '',
  currency: 'ج.م',
};
export function getStoreInfo(): GymStoreInfo {
  return { ...DEFAULT_STORE_INFO, ...load(KEYS.storeInfo, {}) };
}
export function saveStoreInfo(info: GymStoreInfo) { save(KEYS.storeInfo, info); }

export interface CardDisplayOptions {
  showSubscription: boolean;
  showPrice: boolean;
  showStartDate: boolean;
  showEndDate: boolean;
  showSessions: boolean;
  showAllowedDays: boolean;
  showPhone: boolean;
  showPhoto: boolean;
  showQR: boolean;
  showBarcode: boolean;
  showFeatures: boolean;
  showJoinedDate: boolean;
}

export const DEFAULT_CARD_OPTIONS: CardDisplayOptions = {
  showSubscription: true,
  showPrice: false,
  showStartDate: false,
  showEndDate: true,
  showSessions: true,
  showAllowedDays: true,
  showPhone: false,
  showPhoto: true,
  showQR: true,
  showBarcode: true,
  showFeatures: true,
  showJoinedDate: false,
};

export interface GymSettings {
  scanMode: 'scanner' | 'camera' | 'both';
  expiryWarnDays: number;       // warn when subscription has X days left
  autoCheckOutHours: number;    // auto checkout after X hours (0 = disabled)
  printCardOnCreate: boolean;
  enforceAllowedDays: boolean;  // hard-block scanner on disallowed days
  enforceSessions: boolean;     // hard-block when sessions exhausted
  cardOptions: CardDisplayOptions;
}
const DEFAULT_SETTINGS: GymSettings = {
  scanMode: 'both',
  expiryWarnDays: 7,
  autoCheckOutHours: 4,
  printCardOnCreate: false,
  enforceAllowedDays: false,
  enforceSessions: false,
  cardOptions: DEFAULT_CARD_OPTIONS,
};
export function getSettings(): GymSettings {
  const stored = load<Partial<GymSettings>>(KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    cardOptions: { ...DEFAULT_CARD_OPTIONS, ...(stored.cardOptions || {}) },
  };
}
export function saveSettings(s: GymSettings) { save(KEYS.settings, s); }

// ─── Admin Credentials ───
export function getAdminCredentials(): AdminCredentials | null {
  return load<AdminCredentials | null>(KEYS.adminCreds, null);
}
export function setAdminCredentials(c: AdminCredentials) { save(KEYS.adminCreds, c); }
export function isAdminSetup(): boolean { return getAdminCredentials() !== null; }
export function verifyAdmin(u: string, p: string): boolean {
  const c = getAdminCredentials();
  return !!c && c.username === u && c.password === p;
}
export function verifyMasterRecovery(u: string, p: string) {
  return u === MASTER_RECOVERY.username && p === MASTER_RECOVERY.password;
}

// ─── Staff ───
export function getStaff(): Staff[] { return load(KEYS.staff, []); }
export function saveStaff(s: Staff[]) { save(KEYS.staff, s); }
export function addStaff(s: Staff) { const list = getStaff(); list.push(s); saveStaff(list); return list; }
export function updateStaff(s: Staff) { saveStaff(getStaff().map(x => x.id === s.id ? s : x)); }
export function deleteStaff(id: string) { saveStaff(getStaff().filter(x => x.id !== id)); }
export function verifyStaff(code: string, password: string): Staff | null {
  return getStaff().find(s => s.code === code && s.password === password && s.active) || null;
}

// ─── Staff Sessions ───
export function startStaffSession(s: Staff): StaffSession {
  const session: StaffSession = {
    id: crypto.randomUUID(),
    staffId: s.id,
    staffName: s.name,
    loginTime: Date.now(),
  };
  const list = load<StaffSession[]>(KEYS.staffSessions, []);
  list.push(session);
  save(KEYS.staffSessions, list);
  save(KEYS.activeStaffSession, session);
  return session;
}
export function endStaffSession() {
  const active = getActiveStaffSession();
  if (active) {
    active.logoutTime = Date.now();
    const list = load<StaffSession[]>(KEYS.staffSessions, []).map(s =>
      s.id === active.id ? active : s);
    save(KEYS.staffSessions, list);
    localStorage.removeItem(KEYS.activeStaffSession);
  }
}
export function getActiveStaffSession(): StaffSession | null {
  return load<StaffSession | null>(KEYS.activeStaffSession, null);
}

// ─── Members ───
export function getMembers(): Member[] { return load(KEYS.members, []); }
export function saveMembers(list: Member[]) { save(KEYS.members, list); }
export function addMember(m: Member) { const list = getMembers(); list.push(m); saveMembers(list); }
export function updateMember(m: Member) { saveMembers(getMembers().map(x => x.id === m.id ? m : x)); }
export function deleteMember(id: string) { saveMembers(getMembers().filter(x => x.id !== id)); }
export function findMemberByCode(code: string): Member | null {
  const t = code.trim();
  if (!t) return null;
  return getMembers().find(m => m.code === t) || null;
}
export function findMemberById(id: string): Member | null {
  return getMembers().find(m => m.id === id) || null;
}
export function nextMemberCode(): string {
  const n = (load<number>(KEYS.memberCounter, 1000) || 1000) + 1;
  save(KEYS.memberCounter, n);
  return String(n);
}

// ─── Plans ───
const DEFAULT_PLANS: Plan[] = [
  { id: 'p-monthly', name: 'شهر', duration: 'monthly', durationDays: 30, price: 500, includesPersonalTraining: false, active: true, createdAt: Date.now(), color: '#ef4444', description: 'اشتراك شهر كامل' },
  { id: 'p-quarter', name: '3 شهور', duration: 'quarterly', durationDays: 90, price: 1300, includesPersonalTraining: false, active: true, createdAt: Date.now(), color: '#f97316', description: 'اشتراك 3 شهور بخصم' },
  { id: 'p-half', name: '6 شهور', duration: 'half-year', durationDays: 180, price: 2400, includesPersonalTraining: false, active: true, createdAt: Date.now(), color: '#eab308', description: 'اشتراك نصف سنة' },
  { id: 'p-year', name: 'سنة كاملة', duration: 'yearly', durationDays: 365, price: 4500, includesPersonalTraining: true, active: true, createdAt: Date.now(), color: '#22c55e', description: 'اشتراك سنوي شامل تدريب شخصي' },
  { id: 'p-pt', name: 'تدريب شخصي شهر', duration: 'monthly', durationDays: 30, price: 1500, includesPersonalTraining: true, active: true, createdAt: Date.now(), color: '#a855f7', description: 'تدريب شخصي مع كوتش' },
];
export function getPlans(): Plan[] {
  const stored = load<Plan[] | null>(KEYS.plans, null);
  if (stored && stored.length) return stored;
  save(KEYS.plans, DEFAULT_PLANS);
  return DEFAULT_PLANS;
}
export function savePlans(p: Plan[]) { save(KEYS.plans, p); }
export function addPlan(p: Plan) { const l = getPlans(); l.push(p); savePlans(l); }
export function updatePlan(p: Plan) { savePlans(getPlans().map(x => x.id === p.id ? p : x)); }
export function deletePlan(id: string) { savePlans(getPlans().filter(x => x.id !== id)); }

// ─── Subscriptions ───
export function getSubscriptions(): Subscription[] { return load(KEYS.subscriptions, []); }
export function saveSubscriptions(s: Subscription[]) { save(KEYS.subscriptions, s); }
export function addSubscription(s: Subscription) { const l = getSubscriptions(); l.push(s); saveSubscriptions(l); }
export function updateSubscription(s: Subscription) { saveSubscriptions(getSubscriptions().map(x => x.id === s.id ? s : x)); }
export function deleteSubscription(id: string) { saveSubscriptions(getSubscriptions().filter(x => x.id !== id)); }
export function getActiveSubscription(memberId: string): Subscription | null {
  const today = new Date().toISOString().slice(0, 10);
  // pick the latest non-cancelled subscription whose endDate >= today
  return getSubscriptions()
    .filter(s => s.memberId === memberId && s.status !== 'cancelled')
    .sort((a, b) => b.createdAt - a.createdAt)
    .find(s => s.endDate >= today || s.status === 'frozen') || null;
}
export function getMemberSubscriptions(memberId: string): Subscription[] {
  return getSubscriptions().filter(s => s.memberId === memberId).sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Trainers ───
export function getTrainers(): Trainer[] { return load(KEYS.trainers, []); }
export function saveTrainers(t: Trainer[]) { save(KEYS.trainers, t); }
export function addTrainer(t: Trainer) { const l = getTrainers(); l.push(t); saveTrainers(l); }
export function updateTrainer(t: Trainer) { saveTrainers(getTrainers().map(x => x.id === t.id ? x : t)); }
export function deleteTrainer(id: string) { saveTrainers(getTrainers().filter(x => x.id !== id)); }

// ─── Classes ───
export function getClasses(): ClassSchedule[] { return load(KEYS.classes, []); }
export function saveClasses(c: ClassSchedule[]) { save(KEYS.classes, c); }
export function addClass(c: ClassSchedule) { const l = getClasses(); l.push(c); saveClasses(l); }
export function updateClass(c: ClassSchedule) { saveClasses(getClasses().map(x => x.id === c.id ? c : x)); }
export function deleteClass(id: string) { saveClasses(getClasses().filter(x => x.id !== id)); }

// ─── Bookings ───
export function getBookings(): ClassBooking[] { return load(KEYS.bookings, []); }
export function saveBookings(b: ClassBooking[]) { save(KEYS.bookings, b); }
export function addBooking(b: ClassBooking) { const l = getBookings(); l.push(b); saveBookings(l); }

// ─── Attendance ───
export function getAttendance(): Attendance[] { return load(KEYS.attendance, []); }
export function addAttendance(a: Attendance) {
  const list = getAttendance(); list.push(a); save(KEYS.attendance, list);
}
export function getMemberAttendance(memberId: string): Attendance[] {
  return getAttendance().filter(a => a.memberId === memberId).sort((a, b) => b.timestamp - a.timestamp);
}
export function getTodayAttendance(): Attendance[] {
  const today = new Date().toISOString().slice(0, 10);
  return getAttendance().filter(a => a.date === today);
}
export function getLastAttendanceForMember(memberId: string): Attendance | null {
  const list = getMemberAttendance(memberId);
  return list[0] || null;
}

// ─── Offers ───
export function getOffers(): Offer[] { return load(KEYS.offers, []); }
export function saveOffers(o: Offer[]) { save(KEYS.offers, o); }
export function addOffer(o: Offer) { const l = getOffers(); l.push(o); saveOffers(l); }
export function updateOffer(o: Offer) { saveOffers(getOffers().map(x => x.id === o.id ? o : x)); }
export function deleteOffer(id: string) { saveOffers(getOffers().filter(x => x.id !== id)); }
export function getActiveOffers(): Offer[] {
  const today = new Date().toISOString().slice(0, 10);
  return getOffers().filter(o => o.active && o.startDate <= today && o.endDate >= today);
}

// ─── Coupons ───
export function getCoupons(): Coupon[] { return load(KEYS.coupons, []); }
export function saveCoupons(c: Coupon[]) { save(KEYS.coupons, c); }
export function addCoupon(c: Coupon) { const l = getCoupons(); l.push(c); saveCoupons(l); }
export function updateCoupon(c: Coupon) { saveCoupons(getCoupons().map(x => x.id === c.id ? c : x)); }
export function deleteCoupon(id: string) { saveCoupons(getCoupons().filter(x => x.id !== id)); }
export function findCoupon(code: string): Coupon | null {
  const t = code.trim().toUpperCase();
  return getCoupons().find(c => c.code.toUpperCase() === t && c.active) || null;
}
export function consumeCoupon(code: string) {
  const list = getCoupons().map(c => {
    if (c.code.toUpperCase() === code.trim().toUpperCase()) {
      return { ...c, usedCount: c.usedCount + 1 };
    }
    return c;
  });
  saveCoupons(list);
}

// ─── Expenses & Income ───
export function getExpenses(): Expense[] { return load(KEYS.expenses, []); }
export function addExpense(e: Expense) { const l = getExpenses(); l.push(e); save(KEYS.expenses, l); }
export function deleteExpense(id: string) { save(KEYS.expenses, getExpenses().filter(e => e.id !== id)); }

export function getIncome(): Income[] { return load(KEYS.income, []); }
export function addIncome(i: Income) { const l = getIncome(); l.push(i); save(KEYS.income, l); }
export function deleteIncome(id: string) { save(KEYS.income, getIncome().filter(i => i.id !== id)); }

// ─── Payments ───
export function getPayments(): Payment[] { return load(KEYS.payments, []); }
export function addPayment(p: Payment) { const l = getPayments(); l.push(p); save(KEYS.payments, l); }

// ─── Helpers ───
export function getSubscriptionStatus(sub: Subscription): SubscriptionStatusInfo {
  if (sub.status === 'cancelled') return { label: 'ملغي', color: 'destructive' };
  if (sub.status === 'frozen') return { label: 'مجمد', color: 'cafe' };
  const today = new Date().toISOString().slice(0, 10);
  if (sub.endDate < today) return { label: 'منتهي', color: 'destructive' };
  // days remaining
  const diff = Math.ceil((new Date(sub.endDate).getTime() - new Date(today).getTime()) / 86400000);
  if (diff <= 7) return { label: `${diff} يوم متبقي`, color: 'cafe' };
  return { label: `${diff} يوم متبقي`, color: 'success' };
}

export interface SubscriptionStatusInfo {
  label: string;
  color: 'success' | 'destructive' | 'cafe';
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
