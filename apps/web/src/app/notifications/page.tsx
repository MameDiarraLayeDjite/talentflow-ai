"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api";
import { notificationHref, notificationText } from "@/features/notifications/notification-text";

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
        <h1 className="text-2xl font-semibold">Notifications</h1>
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

      {query.isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
      {query.data?.length === 0 && (
        <p className="text-muted-foreground text-sm">Aucune notification.</p>
      )}
      {query.data?.map((notification) => (
        <Card key={notification.id} className={notification.read ? "opacity-60" : ""}>
          <CardContent className="flex items-center justify-between gap-4 text-sm">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markOne.mutate(notification.id)}
              >
                Marquer comme lu
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
