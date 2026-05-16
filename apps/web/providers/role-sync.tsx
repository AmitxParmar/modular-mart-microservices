'use client';

import { useEffect, useMemo } from 'react';
import { useAuthStore, UserRole } from '@/hooks/use-auth-store';
import { useUser } from '@clerk/nextjs';
import { api } from '@/lib/api-client';

const EMPTY_ROLES: UserRole[] = [];

/**
 * RoleSync component ensures that our local state (Zustand) is kept in sync
 * with the roles defined in Clerk's publicMetadata.
 */
export function RoleSync() {
  // Use a single hook for all Clerk state to ensure consistency
  const { isSignedIn, user, isLoaded } = useUser();

  // ... rest of selectors ...
  const currentStoreRoles = useAuthStore((state) => state.roles);
  const activeRole = useAuthStore((state) => state.activeRole);
  const setRoles = useAuthStore((state) => state.setRoles);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // Memoize roles from Clerk metadata, normalized to uppercase
  const combinedRoles = useMemo(() => {
    if (!isLoaded || !user) return EMPTY_ROLES;

    // 1. Get roles from Clerk Metadata and normalize to UPPERCASE
    const rawRoles = (user.publicMetadata?.roles as string[]) || [];
    const clerkRoles = rawRoles.map(r => r.toUpperCase() as UserRole);

    // 2. Remove duplicates (if any)
    const merged = Array.from(new Set(clerkRoles));
    return merged.length === 0 ? EMPTY_ROLES : merged;
  }, [isLoaded, user]);

  // JIT Sync: If user is logged in but missing internalId, trigger sync
  useEffect(() => {
    if (isLoaded && isSignedIn && user && !user.publicMetadata?.internalId) {
      console.group('🔐 RoleSync: JIT Sync Triggered');
      console.log('User is logged in but missing internalId in metadata.');
      console.log('Clerk ID:', user.id);
      console.log('Triggering profile sync via /api/users/me...');
      
      // Using skipTokenCache to ensure we get a fresh token for the sync request
      api.get('/users/me', { skipTokenCache: true } as any)
        .then((res) => {
          console.log('✅ JIT Sync Successful:', res.data);
          console.groupEnd();
        })
        .catch(err => {
          console.error('❌ JIT Sync Failed:', err);
          console.groupEnd();
        });
    }
  }, [isLoaded, isSignedIn, user?.id, user?.publicMetadata?.internalId]);

  useEffect(() => {
    // Only proceed if Clerk has fully loaded the session state
    if (!isLoaded) return;
// ...

    // 1. Handle Sign Out
    if (!isSignedIn) {
      if (currentStoreRoles.length > 0 || activeRole !== null) {
        console.log('RoleSync: User signed out, clearing auth store');
        clearAuth();
      }
      return;
    }

    // 2. Handle Role Updates (User is signed in)
    if (user) {
      // Update the roles list in the store if it changed
      // Use JSON.stringify for deep comparison of the roles array
      if (JSON.stringify(combinedRoles) !== JSON.stringify(currentStoreRoles)) {
        console.log('RoleSync: Updating store roles', combinedRoles);
        setRoles(combinedRoles);
      }

      // 3. Handle Active Role Selection
      if (combinedRoles.length > 0) {
        // If we don't have an active role, or the current one is no longer valid
        if (!activeRole || !combinedRoles.includes(activeRole)) {
          const defaultRole = combinedRoles.includes('CUSTOMER') ? 'CUSTOMER' : combinedRoles[0];
          console.log(`RoleSync: Setting activeRole to default: ${defaultRole}`);
          setActiveRole(defaultRole || "CUSTOMER" );
        }
      } else if (activeRole !== null) {
         console.log('RoleSync: No roles found, clearing activeRole');
         setActiveRole(null);
      }
    }
  }, [
    isLoaded, 
    isSignedIn, 
    user, 
    combinedRoles, 
    activeRole, 
    currentStoreRoles,
    setActiveRole, 
    setRoles, 
    clearAuth
  ]);

  return null;
}



