import { apiFetch } from "@/lib/api-client";

export type NotificationType = "NEW_APPLICATION" | "APPLICATION_STATUS_CHANGED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: {
    jobId?: string;
    jobTitle?: string;
    applicationId?: string;
    candidateName?: string;
    status?: string;
  } | null;
  read: boolean;
  createdAt: string;
}

export function listMyNotifications(accessToken: string) {
  return apiFetch<AppNotification[]>("/notifications", { accessToken });
}

export function markNotificationAsRead(accessToken: string, id: string) {
  return apiFetch<AppNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
    accessToken,
  });
}

export function markAllNotificationsAsRead(accessToken: string) {
  return apiFetch<{ success: boolean }>("/notifications/read-all", {
    method: "PATCH",
    accessToken,
  });
}
