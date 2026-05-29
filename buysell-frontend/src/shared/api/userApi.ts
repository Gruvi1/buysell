import { apiClient } from "./apiClient";
import type { User, UserUpdatePayload } from "./types";

function toUserFormData(payload: UserUpdatePayload) {
  const formData = new FormData();
  if (payload.displayName !== undefined) {
    formData.append("displayName", payload.displayName);
  }
  if (payload.phoneNumber !== undefined) {
    formData.append("phoneNumber", payload.phoneNumber);
  }
  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }
  return formData;
}

export const userApi = {
  async me() {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },

  async list() {
    const { data } = await apiClient.get<User[]>("/users");
    return data;
  },

  async getById(id: number) {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  async update(id: number, payload: UserUpdatePayload) {
    const body = payload.avatar
      ? toUserFormData(payload)
      : {
          displayName: payload.displayName,
          phoneNumber: payload.phoneNumber,
        };
    const { data } = await apiClient.put<string>(`/users/${id}`, body);
    return data;
  },

  async updateMe(payload: UserUpdatePayload) {
    const body = payload.avatar
      ? toUserFormData(payload)
      : {
          displayName: payload.displayName,
          phoneNumber: payload.phoneNumber,
        };
    const { data } = await apiClient.put<User>("/users/me", body);
    return data;
  },

  async remove(id: number) {
    await apiClient.delete(`/users/${id}`);
  },
};
