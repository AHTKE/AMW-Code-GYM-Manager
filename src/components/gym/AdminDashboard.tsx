// Admin dashboard with all gym management tabs.
import { useState } from 'react';
import { ArrowRight, Users, Package, CalendarDays, DollarSign, Settings, Gift, UserCog, Activity, ScanLine, BarChart3, Clock } from 'lucide-react';
import MembersManager from './MembersManager';
import PlansManager from './PlansManager';
import SubscriptionsManager from './SubscriptionsManager';
import TrainersManager from './TrainersManager';
import ClassesManager from './ClassesManager';
import OffersAndCoupons from './OffersAndCoupons';
import FinanceManager from './FinanceManager';
import StaffManager from './StaffManager';
import SettingsManager from './SettingsManager';
import OverviewDashboard from './OverviewDashboard';
import AttendanceLog from './AttendanceLog';
import ShiftsReport from './ShiftsReport';
import { getStoreInfo } from '@/lib/gymStore';
import gymLogo from '@/assets/gym-logo.png';

type Tab = 'overview'|'members'|'subscriptions'|'plans'|'trainers'|'classes'|'offers'|'finance'|'attendance'|'shifts'|'staff'|'settings';

const AdminDashboard = ({ onBack, onScanner }: { onBack: () => void; onScanner: () => void }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const store = getStoreInfo();

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'members', label: 'الأعضاء', icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'الاشتراكات', icon: <Activity className="w-4 h-4" /> },
    { id: 'plans', label: 'الباقات', icon: <Package className="w-4 h-4" /> },
    { id: 'attendance', label: 'الحضور', icon: <ScanLine className="w-4 h-4" /> },
    { id: 'shifts', label: 'الورديات', icon: <Clock className="w-4 h-4" /> },
    { id: 'trainers', label: 'المدربين', icon: <UserCog className="w-4 h-4" /> },
    { id: 'classes', label: 'الحصص', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'offers', label: 'العروض والكوبونات', icon: <Gift className="w-4 h-4" /> },
    { id: 'finance', label: 'الحسابات', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'staff', label: 'الموظفين', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-cairo font-bold text-sm">
          <ArrowRight className="w-4 h-4" /> خروج
        </button>
        <div className="flex items-center gap-2">
          {store.logo
            ? <img src={store.logo} alt="" className="w-7 h-7 rounded object-cover" />
            : <img src={gymLogo} alt="" className="w-7 h-7" />}
          <h1 className="font-cairo font-black text-lg">{store.name || 'GYM'} — لوحة تحكم المدير</h1>
        </div>
        <button onClick={onScanner} className="flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-primary-foreground font-cairo font-bold text-xs shadow-glow">
          <ScanLine className="w-4 h-4" /> الماسح
        </button>
      </div>

      <div className="flex gap-1 p-2 bg-card border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded font-cairo font-bold text-sm whitespace-nowrap transition-colors ${
            tab === t.id ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:bg-secondary'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab==='overview' && <OverviewDashboard />}
        {tab==='members' && <MembersManager />}
        {tab==='subscriptions' && <SubscriptionsManager />}
        {tab==='plans' && <PlansManager />}
        {tab==='attendance' && <AttendanceLog />}
        {tab==='shifts' && <ShiftsReport />}
        {tab==='trainers' && <TrainersManager />}
        {tab==='classes' && <ClassesManager />}
        {tab==='offers' && <OffersAndCoupons />}
        {tab==='finance' && <FinanceManager />}
        {tab==='staff' && <StaffManager />}
        {tab==='settings' && <SettingsManager />}
      </div>
    </div>
  );
};

export default AdminDashboard;
