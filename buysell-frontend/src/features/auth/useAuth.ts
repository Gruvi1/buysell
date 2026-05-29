import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApi } from "../../shared/api/authApi";
import { queryKeys } from "../../shared/lib/queryKeys";

export function useAuthStatus() {
  return useQuery({
    queryKey: queryKeys.authStatus,
    queryFn: authApi.status,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    },
  });
}
