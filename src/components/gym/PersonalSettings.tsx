// Reception personal settings: theme + shortcuts (gated by permissions).
import { GymStaffPermissions, hasFeature } from '@/lib/gymPermissions';
import ThemeAndShortcutsPanel from './ThemeAndShortcutsPanel';
import { Lock } from 'lucide-react';

interface Props { perms: GymStaffPermissions; }

const PersonalSettings = ({ perms }: Props) => {
  const canTheme = hasFeature(perms, 'personal.theme');
  const canShortcuts = hasFeature(perms, 'personal.shortcuts');

  if (!canTheme && !canShortcuts) {
    return (
      <div className="text-center py-12 text-muted-foreground font-cairo">
        <Lock className="w-12 h-12 mx-auto opacity-30 mb-2" />
        لا توجد إعدادات شخصية متاحة لك.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ThemeAndShortcutsPanel showTheme={canTheme} showShortcuts={canShortcuts} />
    </div>
  );
};

export default PersonalSettings;
