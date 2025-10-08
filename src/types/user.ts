// User-related type definitions
export interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  isFirstTime: boolean;
  preferences?: string | null;
  phone?: string | null;
  agent_id?: string | null;
  agent?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  } | null;
  // Legacy support for components that might still reference realtorInfo
  realtorInfo?: RealtorInfo;
}

export interface RealtorInfo {
  name: string;
  email: string;
  phone: string;
}
