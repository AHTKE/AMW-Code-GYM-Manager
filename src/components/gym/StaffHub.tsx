// Staff Hub: shown to reception staff after login.
// - Default landing is the Scanner (per the user's request)
// - A "Features" button opens a grid of all admin features the staff is allowed to access.
// - Includes mandatory shift close on logout, personal settings, and shift summary tile.
import { useState, useMemo, useEffect } from 'react';
import {
  LogOut, ScanLine, LayoutGrid, Users, Activity, Package, CalendarDays,
  UserCog, Gift, DollarSign, Settings, Sun, Moon, ArrowRight, Clock, Sliders,
} from 'lucide-react';
import { Staff } from '@/types/gym';
import { GymStaffPermissions, getStaffPermissions, hasFeature, GymFeatureKey } from '@/lib/gymPermissions';
import { PermissionsProvider } from '@/lib/permissionsContext';
import { getStoreInfo } from '@/lib/gymStore';
import { getTheme, saveTheme } from '@/lib/theme';
import { installShortcutListener } from '@/lib/gymShortcuts';
import { getActiveShiftFor, openShift, computeShiftSummary, formatDuration, Shift } from '@/lib/shifts';

import ScannerPage from './ScannerPage';
import MembersManager from './MembersManager';
import SubscriptionsManager from './SubscriptionsManager';
import PlansManager from './PlansManager';
import AttendanceLog from './AttendanceLog';
import TrainersManager from './TrainersManager';
import ClassesManager from './ClassesManager';
import OffersAndCoupons from './OffersAndCoupons';
import FinanceManager from './FinanceManager';
import OverviewDashboard from './OverviewDashboard';
import PersonalSettings from './PersonalSettings';
import CloseShiftDialog from './CloseShiftDialog';

import gymLogo from '@/assets/gym-logo.png';

type ExtraView = 'personal' | 'shift';
type View = 'scanner' | 'features' | GymFeatureKey | ExtraView;

interface Props { staff: Staff; onLogout: () => void; }

interface FeatureTile {
  key: GymFeatureKey | ExtraView;
  view: View;
  label: string;
  icon: React.ReactNode;
  color: string;
  visible: boolean;
}

const StaffHub = ({ staff, onLogout }: Props) => {
  const [view, setView] = useState<View>('scanner');
  const perms: GymStaffPermissions = useMemo(() => getStaffPermissions(staff.id), [staff.id]);
  const store = getStoreInfo();
  const [themeMode, setThemeMode] = useState(getTheme().mode);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);

  // Open or resume shift on mount
  useEffect(() => {
    const existing = getActiveShiftFor(staff.id);
    if (existing) setActiveShift(existing);
    else setActiveShift(openShift(staff.id, staff.name));
  }, [staff.id, staff.name]);

  const canTheme = hasFeature(perms, 'personal.theme');
  const canShortcuts = hasFeature(perms, 'personal.shortcuts');
  const canShiftSummary = hasFeature(perms, 'shift.view_summary');

  const tiles: FeatureTile[] = useMemo(() => [
    { key: 'overview',           view: 'overview',           label: 'نظرة عامة',  icon: <LayoutGrid className="w-7 h-7" />, color: 'from-blue-500 to-blue-700', visible: hasFeature(perms,'overview') },
    { key: 'members.view',       view: 'members.view',       label: 'الأعضاء',    icon: <Users className="w-7 h-7" />,      color: 'from-emerald-500 to-emerald-700', visible: hasFeature(perms,'members.view') },
    { key: 'subscriptions.view', view: 'subscriptions.view', label: 'الاشتراكات', icon: <Activity className="w-7 h-7" />,   color: 'from-orange-500 to-orange-700', visible: hasFeature(perms,'subscriptions.view') },
    { key: 'plans.view',         view: 'plans.view',         label: 'الباقات',    icon: <Package className="w-7 h-7" />,    color: 'from-purple-500 to-purple-700', visible: hasFeature(perms,'plans.view') },
    { key: 'attendance.view',    view: 'attendance.view',    label: 'الحضور',     icon: <ScanLine className="w-7 h-7" />,   color: 'from-cyan-500 to-cyan-700', visible: hasFeature(perms,'attendance.view') },
    { key: 'trainers.view',      view: 'trainers.view',      label: 'المدربين',   icon: <UserCog className="w-7 h-7" />,    color: 'from-pink-500 to-pink-700', visible: hasFeature(perms,'trainers.view') },
    { key: 'classes.view',       view: 'classes.view',       label: 'الحصص',      icon: <CalendarDays className="w-7 h-7" />,color: 'from-indigo-500 to-indigo-700', visible: hasFeature(perms,'classes.view') },
    { key: 'offers.view',        view: 'offers.view',        label: 'العروض',     icon: <Gift className="w-7 h-7" />,       color: 'from-rose-500 to-rose-700', visible: hasFeature(perms,'offers.view') },
    { key: 'finance.view',       view: 'finance.view',       label: 'الحسابات',   icon: <DollarSign className="w-7 h-7" />, color: 'from-yellow-500 to-yellow-700', visible: hasFeature(perms,'finance.view') },
    { key: 'shift',              view: 'shift',              label: 'الوردية',     icon: <Clock className="w-7 h-7" />,      color: 'from-amber-500 to-amber-700', visible: canShiftSummary },
    { key: 'personal',           view: 'personal',           label: 'إعداداتي',   icon: <Sliders className="w-7 h-7" />,    color: 'from-slate-500 to-slate-700', visible: canTheme || canShortcuts },
  ], [perms, canTheme, canShortcuts, canShiftSummary]);

  const visibleTiles = tiles.filter(t => t.visible);

  // Logout requires closing shift
  const handleLogoutClick = () => {
    if (activeShift) setCloseShiftOpen(true);
    else onLogout();
  };

  // Global shortcuts for the staff hub
  useEffect(() => {
    return installShortcutListener((action) => {
      switch (action) {
        case 'goto-scanner': if (hasFeature(perms,'attendance.scan')) setView('scanner'); break;
        case 'goto-members': if (hasFeature(perms,'members.view')) setView('members.view'); break;
        case 'goto-subscriptions': if (hasFeature(perms,'subscriptions.view')) setView('subscriptions.view'); break;
        case 'goto-attendance': if (hasFeature(perms,'attendance.view')) setView('attendance.view'); break;
        case 'goto-finance': if (hasFeature(perms,'finance.view')) setView('finance.view'); break;
        case 'logout': handleLogoutClick(); break;
        case 'toggle-theme': if (canTheme) toggleTheme(); break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms, activeShift]);

  const toggleTheme = () => {
    const t = getTheme();
    const next = { ...t, mode: t.mode === 'dark' ? 'light' as const : 'dark' as const };
    saveTheme(next);
    setThemeMode(next.mode);
  };

  return (
    <PermissionsProvider value={perms}>
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <button onClick={handleLogoutClick} className="flex items-center gap-2 px-3 py-1.5 rounded text-destructive hover:bg-destructive/10 font-cairo font-bold text-sm">
          <LogOut className="w-4 h-4" /> إغلاق الوردية
        </button>
        <div className="flex items-center gap-2">
          {store.logo
            ? <img src={store.logo} alt="" className="w-7 h-7 rounded object-cover" />
            : <img src={gymLogo} alt="" className="w-7 h-7" />}
          <span className="font-cairo font-black">{store.name || 'GYM'}</span>
        </div>
        <div className="flex items-center gap-2">
          {canTheme && (
            <button onClick={toggleTheme} title="تبديل الثيم" className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <span className="text-xs text-muted-foreground font-cairo hidden sm:inline">{staff.name}</span>
        </div>
      </div>

      {/* Body */}
      {view === 'scanner' ? (
        <>
          <div className="flex-1 overflow-auto">
            {hasFeature(perms, 'attendance.scan')
              ? <ScannerPage staffName={staff.name} />
              : <NoAccess label="ليس لديك صلاحية لاستخدام الماسح" />
            }
          </div>
          {visibleTiles.length > 0 && (
            <div className="border-t border-border bg-card p-3">
              <button onClick={()=>setView('features')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-cairo font-black shadow-glow">
                <LayoutGrid className="w-5 h-5" /> فتح الخواص ({visibleTiles.length})
              </button>
            </div>
          )}
        </>
      ) : view === 'features' ? (
        <FeaturesGrid tiles={visibleTiles} onPick={v => setView(v)} onBackToScanner={()=>setView('scanner')} canScan={hasFeature(perms,'attendance.scan')} />
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
            <button onClick={()=>setView('features')} className="flex items-center gap-2 text-sm font-cairo font-bold text-muted-foreground hover:text-foreground">
              <ArrowRight className="w-4 h-4" /> رجوع للقائمة
            </button>
            <button onClick={()=>setView('scanner')} className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-cairo font-bold shadow-glow">
              <ScanLine className="w-3.5 h-3.5" /> الماسح
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <FeatureContent view={view} perms={perms} staff={staff} activeShift={activeShift} />
          </div>
        </div>
      )}

      {closeShiftOpen && activeShift && (
        <CloseShiftDialog
          shift={activeShift}
          showRevenue={hasFeature(perms,'shift.view_own_revenue')}
          showVisits={hasFeature(perms,'shift.view_own_visits')}
          onClose={()=>setCloseShiftOpen(false)}
          onConfirmed={()=>{ setCloseShiftOpen(false); onLogout(); }}
        />
      )}
    </div>
    </PermissionsProvider>
  );
};

const FeaturesGrid = ({ tiles, onPick, onBackToScanner, canScan }: {
  tiles: FeatureTile[]; onPick: (v: View) => void; onBackToScanner: () => void; canScan: boolean;
}) => (
  <div className="flex-1 overflow-auto p-4">
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cairo font-black text-2xl">الخواص المتاحة</h2>
        {canScan && (
          <button onClick={onBackToScanner} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm font-cairo font-bold">
            <ArrowRight className="w-4 h-4" /> رجوع للماسح
          </button>
        )}
      </div>
      {tiles.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground font-cairo">
          <LayoutGrid className="w-16 h-16 mx-auto opacity-30 mb-2" />
          لا يوجد لديك صلاحيات على أي خاصية. اطلب من المدير منحك صلاحيات.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tiles.map(t => (
            <button key={t.key} onClick={()=>onPick(t.view)}
              className={`group p-5 rounded-2xl bg-gradient-to-br ${t.color} text-white shadow-card hover:scale-105 transition-transform`}>
              <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto">
                {t.icon}
              </div>
              <div className="font-cairo font-black text-center">{t.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
);

const FeatureContent = ({ view, perms, staff, activeShift }: { view: View; perms: GymStaffPermissions; staff: Staff; activeShift: Shift | null }) => {
  switch (view) {
    case 'overview': return hasFeature(perms,'overview') ? <OverviewDashboard /> : <NoAccess />;
    case 'members.view': return <MembersManager />;
    case 'subscriptions.view': return <SubscriptionsManager />;
    case 'plans.view': return <PlansManager />;
    case 'attendance.view': return <AttendanceLog />;
    case 'trainers.view': return <TrainersManager />;
    case 'classes.view': return <ClassesManager />;
    case 'offers.view': return <OffersAndCoupons />;
    case 'finance.view': return <FinanceManager />;
    case 'personal': return <PersonalSettings perms={perms} />;
    case 'shift': return <ShiftSummaryView shift={activeShift} perms={perms} />;
    default: return <NoAccess />;
  }
};

const ShiftSummaryView = ({ shift, perms }: { shift: Shift | null; perms: GymStaffPermissions }) => {
  if (!shift) return <NoAccess label="لا توجد وردية مفتوحة" />;
  const sm = computeShiftSummary(shift);
  const cur = getStoreInfo().currency;
  const showRevenue = hasFeature(perms,'shift.view_own_revenue');
  const showVisits = hasFeature(perms,'shift.view_own_visits');
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 text-primary font-cairo font-black text-lg">
          <Clock className="w-5 h-5" /> الوردية الحالية
        </div>
        <div className="text-sm text-muted-foreground font-cairo mt-1">
          بدأت: {new Date(shift.openedAt).toLocaleString('ar-EG')}
        </div>
        <div className="text-sm font-cairo mt-1">المدة حتى الآن: <span className="font-black">{formatDuration(sm.durationMs)}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card label="أعضاء جدد" value={sm.membersAdded} />
        {showVisits && <Card label="زيارات/مسحات" value={sm.attendanceScans} />}
        <Card label="اشتراكات جديدة" value={sm.subscriptionsCreated} />
        <Card label="مدفوعات" value={sm.paymentsCount} />
        {showRevenue && <Card label="إيراد الاشتراكات" value={`${sm.subscriptionsRevenue.toFixed(2)} ${cur}`} highlight />}
        {showRevenue && <Card label="مدفوعات إضافية" value={`${sm.paymentsRevenue.toFixed(2)} ${cur}`} highlight />}
        {showRevenue && <Card label="صافي الوردية" value={`${sm.netCash.toFixed(2)} ${cur}`} highlight />}
      </div>
    </div>
  );
};

const Card = ({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className={`rounded-xl p-4 ${highlight ? 'bg-success/10 border border-success/30' : 'bg-card border border-border'}`}>
    <div className="text-xs text-muted-foreground font-cairo">{label}</div>
    <div className="font-cairo font-black text-2xl mt-1">{value}</div>
  </div>
);

const NoAccess = ({ label = 'ليس لديك صلاحية الوصول لهذه الميزة' }: { label?: string }) => (
  <div className="h-full flex items-center justify-center text-muted-foreground font-cairo p-8 text-center">
    <div>
      <div className="text-5xl mb-3">🔒</div>
      <div className="font-bold">{label}</div>
    </div>
  </div>
);

export default StaffHub;
