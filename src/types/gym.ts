// Gym Management System Types

export type Gender = 'male' | 'female';
export type SubscriptionStatus = 'active' | 'expired' | 'frozen' | 'cancelled';
export type PlanDuration = 'monthly' | 'quarterly' | 'half-year' | 'yearly' | 'custom';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'wallet';
export type AttendanceType = 'check-in' | 'check-out';

export interface Member {
  id: string;
  code: string;            // unique short code, also encoded in QR
  name: string;
  phone: string;
  email?: string;
  gender: Gender;
  birthDate?: string;      // YYYY-MM-DD
  address?: string;
  photo?: string;          // base64 data URL
  notes?: string;
  emergencyContact?: string;
  height?: number;         // cm
  weight?: number;         // kg
  goals?: string;
  medicalConditions?: string;
  trainerId?: string;
  joinedAt: number;
  active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  duration: PlanDuration;
  durationDays: number;
  price: number;
  description?: string;
  includesPersonalTraining: boolean;
  classesPerWeek?: number; // optional cap
  sessionsTotal?: number;       // total sessions included (0/undefined = unlimited)
  allowedDays?: number[];       // 0..6 (Sun..Sat) — empty/undefined = all days
  freezeDaysAllowed?: number;   // max freeze days for this plan
  active: boolean;
  color?: string;
  createdAt: number;
}

export interface Subscription {
  id: string;
  memberId: string;
  planId: string;
  planName: string;        // snapshot
  startDate: string;       // YYYY-MM-DD
  endDate: string;         // YYYY-MM-DD
  price: number;
  paid: number;
  paymentMethod: PaymentMethod;
  status: SubscriptionStatus;
  freezeDays?: number;     // total accumulated freeze days
  freezeStart?: string;
  notes?: string;
  couponCode?: string;
  discount?: number;
  sessionsTotal?: number;  // snapshot from plan, can be overridden
  sessionsUsed?: number;   // visits counter
  allowedDays?: number[];  // snapshot from plan, can be overridden per subscription
  createdAt: number;
  createdBy?: string;      // user id
}

export interface Trainer {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  photo?: string;
  bio?: string;
  monthlySalary?: number;
  commissionPerSession?: number;
  active: boolean;
  createdAt: number;
}

export interface ClassSchedule {
  id: string;
  name: string;
  trainerId: string;
  trainerName: string;
  dayOfWeek: number;       // 0..6 (Sun..Sat)
  startTime: string;       // HH:mm
  endTime: string;
  capacity: number;
  description?: string;
  active: boolean;
}

export interface ClassBooking {
  id: string;
  classId: string;
  memberId: string;
  date: string;            // YYYY-MM-DD
  attended: boolean;
  createdAt: number;
}

export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;      // snapshot
  type: AttendanceType;
  timestamp: number;
  date: string;
  time: string;
  scannedBy?: string;
  note?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  appliesToPlanIds?: string[]; // empty/undefined = all plans
  startDate: string;
  endDate: string;
  active: boolean;
  banner?: string;         // optional image data URL
  createdAt: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxUses: number;          // 0 = unlimited
  usedCount: number;
  expiresAt?: string;
  active: boolean;
  createdAt: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  timestamp: number;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  timestamp: number;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  timestamp: number;
  note?: string;
  receivedBy?: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface Staff {
  id: string;
  name: string;
  code: string;            // login code
  password: string;
  role: 'reception' | 'trainer' | 'manager';
  active: boolean;
  createdAt: number;
}

export interface StaffSession {
  id: string;
  staffId: string;
  staffName: string;
  loginTime: number;
  logoutTime?: number;
}

export type AppView =
  | 'start'
  | 'admin-login'
  | 'staff-login'
  | 'dashboard'
  | 'admin'
  | 'scanner';
