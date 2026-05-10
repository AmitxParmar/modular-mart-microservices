import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

interface AuthState {
  roles: UserRole[];
  activeRole: UserRole | null;
  
  setRoles: (roles: UserRole[]) => void;
  setActiveRole: (role: UserRole | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      roles: [],
      activeRole: null,

      setRoles: (roles) => set({ roles }),
      setActiveRole: (activeRole) => set({ activeRole }),
      clearAuth: () => set({ roles: [], activeRole: null }),
    }),
    {
      name: 'modularmart-auth-storage',
    }
  )
);
