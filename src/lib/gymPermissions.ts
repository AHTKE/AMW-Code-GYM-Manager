// Per-staff permission system for gym app.
// Admin assigns granular feature access to each reception/staff member.

export type GymFeatureKey =
  | 'overview'
  | 'members.view' | 'members.create' | 'members.edit' | 'members.delete' | 'members.print_card' | 'members.upload_photo'
  | 'subscriptions.view' | 'subscriptions.create' | 'subscriptions.edit' | 'subscriptions.freeze' | 'subscriptions.cancel' | 'subscriptions.collect_payment'
  | 'plans.view' | 'plans.manage'
  | 'attendance.view' | 'attendance.scan'
  | 'trainers.view' | 'trainers.manage'
  | 'classes.view' | 'classes.manage' | 'classes.book'
  | 'offers.view' | 'offers.manage' | 'coupons.use'
  | 'finance.view' | 'finance.add_expense' | 'finance.add_income' | 'finance.reports'
  | 'staff.manage'
  | 'settings.view' | 'settings.theme' | 'settings.shortcuts' | 'settings.print' | 'settings.system'
  // Personal/shift related
  | 'shift.view_own_revenue' | 'shift.view_own_visits' | 'shift.view_summary'
  | 'personal.theme' | 'personal.shortcuts';

export interface GymStaffPermissions {
  // a flat map; missing/false = denied
  features: Partial<Record<GymFeatureKey, boolean>>;
  // optional UI defaults
  showRevenueStats?: boolean;
}

const KEY_PREFIX = 'gym_perms_';
const GLOBAL_KEY = 'gym_perms_global';

// Default for fresh staff: minimal — just attendance scan + members view + subscription create
export const DEFAULT_PERMISSIONS: GymStaffPermissions = {
  features: {
    'attendance.scan': true,
    'attendance.view': true,
    'members.view': true,
    'members.create': true,
    'members.print_card': true,
    'subscriptions.view': true,
    'subscriptions.create': true,
    'subscriptions.collect_payment': true,
    'plans.view': true,
    'classes.view': true,
    'offers.view': true,
    'coupons.use': true,
    // Personal defaults
    'personal.theme': true,
    'personal.shortcuts': true,
    'shift.view_summary': true,
  },
  showRevenueStats: false,
};

// All-on (admin defaults)
export const ALL_PERMISSIONS: GymStaffPermissions = {
  features: ALL_FEATURE_KEYS_ON(),
  showRevenueStats: true,
};

function ALL_FEATURE_KEYS_ON(): Partial<Record<GymFeatureKey, boolean>> {
  const list: GymFeatureKey[] = [
    'overview',
    'members.view','members.create','members.edit','members.delete','members.print_card','members.upload_photo',
    'subscriptions.view','subscriptions.create','subscriptions.edit','subscriptions.freeze','subscriptions.cancel','subscriptions.collect_payment',
    'plans.view','plans.manage',
    'attendance.view','attendance.scan',
    'trainers.view','trainers.manage',
    'classes.view','classes.manage','classes.book',
    'offers.view','offers.manage','coupons.use',
    'finance.view','finance.add_expense','finance.add_income','finance.reports',
    'staff.manage',
    'settings.view','settings.theme','settings.shortcuts','settings.print','settings.system',
    'shift.view_own_revenue','shift.view_own_visits','shift.view_summary',
    'personal.theme','personal.shortcuts',
  ];
  return list.reduce((a, k) => { a[k] = true; return a; }, {} as Partial<Record<GymFeatureKey, boolean>>);
}

export function getGlobalPermissions(): GymStaffPermissions {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PERMISSIONS;
  } catch { return DEFAULT_PERMISSIONS; }
}

export function saveGlobalPermissions(p: GymStaffPermissions) {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(p));
}

export function getStaffPermissions(staffId: string): GymStaffPermissions {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + staffId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getGlobalPermissions();
}

export function saveStaffPermissions(staffId: string, p: GymStaffPermissions) {
  localStorage.setItem(KEY_PREFIX + staffId, JSON.stringify(p));
}

export function clearStaffPermissions(staffId: string) {
  localStorage.removeItem(KEY_PREFIX + staffId);
}

export function hasFeature(perms: GymStaffPermissions | null, key: GymFeatureKey): boolean {
  if (!perms) return false;
  return !!perms.features[key];
}

// Grouped for UI rendering
export const PERMISSION_GROUPS: { title: string; items: { key: GymFeatureKey; label: string }[] }[] = [
  { title: 'لوحة التحكم', items: [
    { key: 'overview', label: 'عرض النظرة العامة' },
  ]},
  { title: 'الأعضاء', items: [
    { key: 'members.view', label: 'عرض الأعضاء' },
    { key: 'members.create', label: 'إضافة عضو جديد' },
    { key: 'members.edit', label: 'تعديل بيانات الأعضاء' },
    { key: 'members.delete', label: 'حذف الأعضاء' },
    { key: 'members.print_card', label: 'طباعة البطاقة' },
    { key: 'members.upload_photo', label: 'رفع صورة العضو' },
  ]},
  { title: 'الاشتراكات', items: [
    { key: 'subscriptions.view', label: 'عرض الاشتراكات' },
    { key: 'subscriptions.create', label: 'إنشاء اشتراك جديد' },
    { key: 'subscriptions.edit', label: 'تعديل الاشتراكات' },
    { key: 'subscriptions.freeze', label: 'تجميد/استئناف الاشتراك' },
    { key: 'subscriptions.cancel', label: 'إلغاء الاشتراك' },
    { key: 'subscriptions.collect_payment', label: 'تحصيل المدفوعات' },
  ]},
  { title: 'الباقات', items: [
    { key: 'plans.view', label: 'عرض الباقات' },
    { key: 'plans.manage', label: 'إدارة (إضافة/تعديل/حذف) الباقات' },
  ]},
  { title: 'الحضور والماسح', items: [
    { key: 'attendance.scan', label: 'استخدام الماسح / تسجيل الحضور' },
    { key: 'attendance.view', label: 'عرض سجل الحضور' },
  ]},
  { title: 'المدربين', items: [
    { key: 'trainers.view', label: 'عرض المدربين' },
    { key: 'trainers.manage', label: 'إدارة المدربين' },
  ]},
  { title: 'الحصص', items: [
    { key: 'classes.view', label: 'عرض الحصص' },
    { key: 'classes.manage', label: 'إدارة الحصص' },
    { key: 'classes.book', label: 'حجز حصص للأعضاء' },
  ]},
  { title: 'العروض والكوبونات', items: [
    { key: 'offers.view', label: 'عرض العروض' },
    { key: 'offers.manage', label: 'إدارة العروض والكوبونات' },
    { key: 'coupons.use', label: 'تطبيق الكوبونات على الاشتراكات' },
  ]},
  { title: 'الحسابات', items: [
    { key: 'finance.view', label: 'عرض الحسابات' },
    { key: 'finance.add_expense', label: 'إضافة مصروفات' },
    { key: 'finance.add_income', label: 'إضافة إيرادات إضافية' },
    { key: 'finance.reports', label: 'عرض التقارير المالية' },
  ]},
  { title: 'الإعدادات', items: [
    { key: 'settings.view', label: 'فتح الإعدادات' },
    { key: 'settings.theme', label: 'تغيير الثيم والألوان' },
    { key: 'settings.shortcuts', label: 'تخصيص اختصارات الكيبورد' },
    { key: 'settings.print', label: 'إعدادات الطباعة' },
    { key: 'settings.system', label: 'إعدادات النظام (متقدم)' },
  ]},
  { title: 'الوردية والتخصيص الشخصي', items: [
    { key: 'shift.view_summary', label: 'رؤية ملخص الوردية الحالية' },
    { key: 'shift.view_own_revenue', label: 'رؤية الإيرادات التي حصّلها' },
    { key: 'shift.view_own_visits', label: 'رؤية عدد الزيارات/المسحات' },
    { key: 'personal.theme', label: 'تغيير الثيم الشخصي (نهاري/ليلي/ألوان)' },
    { key: 'personal.shortcuts', label: 'تخصيص اختصارات الكيبورد الخاصة به' },
  ]},
];
