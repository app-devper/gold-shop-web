import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  host: string | null
  userRole: string | null
  clientId: string | null
  username: string | null
  branchName: string | null
  setAuth: (token: string, host: string, role: string, clientId: string) => void
  setUserInfo: (username: string, branchName: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      host: null,
      userRole: null,
      clientId: null,
      username: null,
      branchName: null,
      setAuth: (accessToken, host, userRole, clientId) => set({ accessToken, host, userRole, clientId }),
      setUserInfo: (username, branchName) => set({ username, branchName }),
      logout: () => set({ accessToken: null, host: null, userRole: null, clientId: null, username: null, branchName: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
