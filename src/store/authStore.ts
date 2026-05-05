import { create } from 'zustand';

// V3 Strict Typing: Define the shape of our Session to avoid 'any'
export interface User {
  id: string;
  email?: string;
}

export interface Session {
  user: User;
  access_token?: string;
}

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ==========================================
  // V3 DEV HACK: ACTIVE BYPASS
  // Change this to `session: null` when you are 
  // ready to connect Supabase in Phase 4.
  // ==========================================
  session: { 
    user: { 
      id: '00000000-0000-0000-0000-000000000000', 
      email: 'test@test.com' 
    },
    access_token: 'test'
  }, 
  
  setSession: (session) => set({ session }),
  
  clearSession: () => set({ session: null }),
  
  signOut: async () => {
    // V3 TODO: supabase.auth.signOut() will be added here later
    console.log("[AuthStore] User signed out locally.");
    set({ session: null });
  }
}));