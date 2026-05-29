export const queryKeys = {
  authStatus: ["auth", "status"] as const,
  products: (filters?: Record<string, unknown>) => ["products", filters ?? {}] as const,
  product: (id: number) => ["products", id] as const,
  dialogs: ["dialogs"] as const,
  dialogMessages: (id: number) => ["dialogs", id, "messages"] as const,
  currentUser: ["users", "me"] as const,
  users: ["users"] as const,
  user: (id: number) => ["users", id] as const,
};
