import { apiClient } from "./apiClient";
import type { Dialog, Message, MessageCreatePayload } from "./types";

export const chatApi = {
  async getOrCreateDialog(productId: number) {
    const { data } = await apiClient.post<Dialog>("/v1/chat/dialogs", null, {
      params: { productId },
    });
    return data;
  },

  async listDialogs() {
    const { data } = await apiClient.get<Dialog[]>("/v1/chat/dialogs");
    return data;
  },

  async listMessages(dialogId: number) {
    const { data } = await apiClient.get<Message[]>(
      `/v1/chat/dialogs/${dialogId}/messages`
    );
    return data;
  },

  async sendMessage(dialogId: number, payload: MessageCreatePayload) {
    const { data } = await apiClient.post<Message>(
      `/v1/chat/dialogs/${dialogId}/messages`,
      payload
    );
    return data;
  },
};
