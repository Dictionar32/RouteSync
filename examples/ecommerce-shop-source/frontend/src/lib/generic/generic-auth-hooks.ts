import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "../core/query-key";
import useAuthStore, { User } from "@/lib/stores/auth-store";

export const createAuthHooks = <
  LoginForm,
  RegisterForm,
  ProfileData,
  LoginResponse extends { user: ProfileData; token: string },
  RegisterResponse extends { user: ProfileData; token: string },
  LogoutResponse = unknown
>(config: {
  service: {
    login: (form: LoginForm) => Promise<LoginResponse>;
    register: (form: RegisterForm) => Promise<RegisterResponse>;
    logout: () => Promise<LogoutResponse>;
    profile: () => Promise<ProfileData>;
  };
}) => {
  const { service } = config;

  return {
    /* ================= LOGIN ================= */
    useLogin() {
      const qc = useQueryClient();
      const setAuth = useAuthStore((s) => s.setAuth);

      return useMutation({
        mutationFn: service.login,

        onSuccess: (session: LoginResponse) => {
          // ✅ sync zustand (source of truth)
          setAuth(<User><unknown>session.user, session.token);

          // ✅ instant cache sync (no refetch)
          qc.setQueryData(QueryKey.auth.me(), session.user);
          qc.setQueryData(QueryKey.auth.profile(), session.user);
        },
      });
    },

    /* ================= REGISTER ================= */
    useRegister() {
      const qc = useQueryClient();
      const setAuth = useAuthStore((s) => s.setAuth);

      return useMutation({
        mutationFn: service.register,

        onSuccess: (session: RegisterResponse) => {
          setAuth(<User><unknown>session.user, session.token);

          qc.setQueryData(QueryKey.auth.me(), session.user);
          qc.setQueryData(QueryKey.auth.profile(), session.user);
        },
      });
    },

    /* ================= LOGOUT ================= */
    useLogout() {
      const qc = useQueryClient();
      const logoutStore = useAuthStore((s) => s.logout);

      return useMutation({
        mutationFn: service.logout,

        onSuccess: () => {
          logoutStore();
          qc.clear();
        },

        // even if API fails → force logout
        onError: () => {
          logoutStore();
          qc.clear();
        },
      });
    },

    /* ================= PROFILE ================= */
    useProfile() {
      const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
      const storedUser = useAuthStore((s) => s.user);

      return useQuery({
        queryKey: QueryKey.auth.profile(),
        queryFn: service.profile,
        enabled: isAuthenticated,
        placeholderData: <undefined><unknown>(() => storedUser ?? undefined),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: false,
      });
    },
  };
};