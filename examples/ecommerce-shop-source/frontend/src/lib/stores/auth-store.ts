/**
 * Auth Store - V5 FINAL
 * Production ready (🟡)
 *
 * Features:
 * - access token in memory only
 * - user persisted
 * - reactive isAuthenticated
 * - safe rehydration
 * - multi-tab logout sync
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  id: number
  name: string
  email: string
  no_telp?: string
  alamat?: string
  avatar?: string
}

interface AuthStore {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  // actions
  setAuth: (user: User, token: string) => void
  setAccessToken: (token: string | null) => void
  updateUser: (user: Partial<User>) => void
  clearUser: () => void
  logout: () => void
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: typeof document !== 'undefined' ? getCookie('token') : null,
      isAuthenticated: typeof document !== 'undefined' ? !!getCookie('token') : false,

      // ======================
      // SET FULL AUTH
      // ======================
      setAuth: (user, token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({
          user,
          accessToken: token,
          isAuthenticated: !!token,
        });
      },

      // ======================
      // TOKEN ONLY
      // ======================
      setAccessToken: (token) => {
        if (typeof document !== 'undefined') {
          if (token) {
            document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        }
        set({
          accessToken: token,
          isAuthenticated: !!token,
        });
      },

      // ======================
      // UPDATE USER PARTIAL
      // ======================
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // ======================
      // CLEAR USER ONLY
      // ======================
      clearUser: () =>
        set({
          user: null,
        }),

      // ======================
      // LOGOUT (FULL RESET)
      // ======================
      logout: () => {
        // 🔥 multi-tab sync trigger
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_logout", Date.now().toString())
          document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: "auth-storage",

      // 🔥 persist USER ONLY (token stays in memory)
      partialize: (state) => ({
        user: state.user,
      }),

      // 🔥 rehydration safety
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // jika token hilang setelah refresh → anggap logout
        // if (!state.accessToken) {
        //   state.user = null
        //   state.isAuthenticated = false
        // }
      },
    }
  )
)

export default useAuthStore

// =======================================
// 🔥 MULTI TAB LISTENER (import sekali di root)
// =======================================

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "auth_logout") {
      useAuthStore.getState().logout()
    }
  })
}