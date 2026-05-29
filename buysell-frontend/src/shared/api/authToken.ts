import type { AuthStatus } from "./types";

const tokenKey = "buysell.accessToken";

type JwtPayload = {
  sub?: string;
  roles?: string[];
  exp?: number;
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
};

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(tokenKey);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(tokenKey, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(tokenKey);
}

export function getAuthStatusFromToken(): AuthStatus {
  const token = getAccessToken();
  const payload = token ? decodeJwtPayload(token) : null;

  if (!token || !payload || isExpired(payload)) {
    clearAccessToken();
    return { authenticated: false, username: null, userId: null, admin: false };
  }

  const roles = payload.roles ?? [];
  return {
    authenticated: true,
    username: payload.sub ?? null,
    userId: pickUserId(payload),
    admin: roles.includes("ADMIN") || roles.includes("ROLE_ADMIN"),
  };
}

function pickUserId(payload: JwtPayload) {
  const value = payload.userId ?? payload.user_id ?? payload.id;
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload) {
  return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
}
