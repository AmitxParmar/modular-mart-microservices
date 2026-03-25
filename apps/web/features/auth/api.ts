import { api } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export async function fetchMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(ENDPOINTS.ME);
  return data;
}
