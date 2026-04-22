// Main Gym App page - replaces POSPage entirely.
import { useState, useEffect } from 'react';
import { Staff, AppView } from '@/types/gym';
import { getActiveStaffSession, endStaffSession, getStaff } from '@/lib/gymStore';
import { applyTheme } from '@/lib/theme';
import LoginScreen from '@/components/gym/LoginScreen';
import AdminDashboard from '@/components/gym/AdminDashboard';
import StaffHub from '@/components/gym/StaffHub';
import ActivationGate from '@/components/auth/ActivationGate';

const GymPage = () => {
  const [view, setView] = useState<AppView>('start');
  const [staff, setStaff] = useState<Staff | null>(null);
  const [adminAuthed, setAdminAuthed] = useState(false);

  useEffect(() => {
    applyTheme();
    const s = getActiveStaffSession();
    if (s) {
      // Try to load full staff record (so permissions stay accurate)
      const full = getStaff().find(x => x.id === s.staffId);
      setStaff(full || { id: s.staffId, name: s.staffName, code: '', password: '', role: 'reception', active: true, createdAt: 0 });
      setView('scanner');
    }
  }, []);

  const handleStaffLogin = (s: Staff) => { setStaff(s); setView('scanner'); };
  const handleAdminLogin = () => { setAdminAuthed(true); setView('admin'); };

  const handleLogout = () => {
    endStaffSession();
    setStaff(null); setAdminAuthed(false);
    setView('start');
  };

  return (
    <ActivationGate>
      {view === 'start' && (
        <LoginScreen onAdminSuccess={handleAdminLogin} onStaffSuccess={handleStaffLogin} />
      )}
      {view === 'admin' && adminAuthed && (
        <AdminDashboard onBack={handleLogout} onScanner={() => setView('scanner')} />
      )}
      {view === 'scanner' && (
        adminAuthed ? (
          // Admin uses scanner via StaffHub-like view but with full permissions implicit
          <StaffHub
            staff={{ id: 'admin', name: 'المدير', code: '', password: '', role: 'manager', active: true, createdAt: 0 }}
            onLogout={handleLogout}
          />
        ) : (
          staff && <StaffHub staff={staff} onLogout={handleLogout} />
        )
      )}
    </ActivationGate>
  );
};

export default GymPage;
