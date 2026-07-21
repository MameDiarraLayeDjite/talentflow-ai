"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/features/notifications/api";
import { notificationHref, notificationText } from "@/features/notifications/notification-text";

const NOTIFICATION_ICON: Record<AppNotification["type"], typeof Bell> = {
  NEW_APPLICATION: UserPlus,
  APPLICATION_STATUS_CHANGED: RefreshCw,
};

export default function NotificationsPage() {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !accessToken) {
    return null;
  }

  return <NotificationsList accessToken={accessToken} />;
}

function NotificationsList({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listMyNotifications(accessToken),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(accessToken, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsAsRead(accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const hasUnread = query.data?.some((n) => !n.read);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}
      {query.data?.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
          <Bell className="size-6" />
          Aucune notification.
        </div>
      )}
      {query.data?.map((notification) => {
        const Icon = NOTIFICATION_ICON[notification.type] ?? Bell;
        return (
          <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
            <CardContent className="flex items-center gap-3 text-sm">
              <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-4" />
              </div>
              <Link
                href={notificationHref(notification)}
                onClick={() => {
                  if (!notification.read) markOne.mutate(notification.id);
                }}
                className="flex-1 underline-offset-2 hover:underline"
              >
                {notificationText(notification)}
              </Link>
              {!notification.read && (
                <span className="bg-primary size-2 shrink-0 rounded-full" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </main>
  );
}
