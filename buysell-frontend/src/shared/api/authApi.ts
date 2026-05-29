import { apiClient } from "./apiClient";
import { clearAccessToken, getAuthStatusFromToken, setAccessToken } from "./authToken";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "./types";

export const authApi = {
  async login(payload: LoginRequest) {
    const { data } = await apiClient.post<AuthResponse>("/v1/auth/login", payload);
    setAccessToken(data.token);
    return data;
  },

  async register(payload: RegisterRequest) {
    const { data } = await apiClient.post<User>("/v1/auth/register", payload);
    return data;
  },

  status() {
    return Promise.resolve(getAuthStatusFromToken());
  },

  logout() {
    clearAccessToken();
    return Promise.resolve();
  },
};
