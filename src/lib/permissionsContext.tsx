// React context for staff permissions, so any nested component can check.
import { createContext, useContext, ReactNode } from 'react';
import { GymStaffPermissions, ALL_PERMISSIONS, hasFeature, GymFeatureKey } from '@/lib/gymPermissions';

const PermissionsContext = createContext<GymStaffPermissions>(ALL_PERMISSIONS);

export const PermissionsProvider = ({ value, children }: { value: GymStaffPermissions; children: ReactNode }) => (
  <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
);

export const usePermissions = () => useContext(PermissionsContext);
export const useCan = (key: GymFeatureKey) => hasFeature(useContext(PermissionsContext), key);
