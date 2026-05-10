import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { UserRole } from '@/hooks/use-auth-store';

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: { id: string; name: UserRole }[];
  createdAt: string;
  updatedAt: string;
}


export async function fetchMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(ENDPOINTS.ME);
  return data;
}
