import type { AppNotification } from "./api";

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "reçue",
  IN_REVIEW: "en revue",
  INTERVIEW: "en entretien",
  REJECTED: "refusée",
  ACCEPTED: "acceptée",
};

export function notificationText(notification: AppNotification): string {
  const payload = notification.payload ?? {};
  switch (notification.type) {
    case "NEW_APPLICATION":
      return `${payload.candidateName ?? "Un candidat"} a postulé à "${payload.jobTitle ?? "ton offre"}"`;
    case "APPLICATION_STATUS_CHANGED":
      return `Ta candidature pour "${payload.jobTitle ?? "une offre"}" est maintenant ${
        STATUS_LABEL[payload.status ?? ""] ?? payload.status
      }`;
    default:
      return "Nouvelle notification";
  }
}

export function notificationHref(notification: AppNotification): string {
  const payload = notification.payload ?? {};
  if (notification.type === "NEW_APPLICATION" && payload.jobId) {
    return `/jobs/${payload.jobId}/applications`;
  }
  if (notification.type === "APPLICATION_STATUS_CHANGED") {
    return "/applications";
  }
  return "/notifications";
}
