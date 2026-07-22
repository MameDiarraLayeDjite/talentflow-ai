"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { listMyNotifications } from "@/features/notifications/api";

function NotificationsLink({ accessToken }: { accessToken: string }) {
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listMyNotifications(accessToken),
    refetchInterval: 15000,
  });
  const unreadCount = query.data?.filter((n) => !n.read).length ?? 0;

  return (
    <Link href="/notifications">
      Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
    </Link>
  );
}

export function Nav() {
  const { user, isLoading, accessToken, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/" className="font-semibold">
          TalentFlow AI
        </Link>

        {isLoading ? null : user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs">Offres</Link>
            {user.role !== "ADMIN" && <Link href="/profile">Mon profil</Link>}
            {user.role === "CANDIDATE" && (
              <>
                <Link href="/resumes">Mes CV</Link>
                <Link href="/applications">Mes candidatures</Link>
              </>
            )}
            {user.role === "COMPANY" && (
              <>
                <Link href="/jobs/new">Publier une offre</Link>
                <Link href="/jobs/mine">Mes offres</Link>
              </>
            )}
            {user.role === "ADMIN" && <Link href="/admin">Admin</Link>}
            {accessToken && <NotificationsLink accessToken={accessToken} />}
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Se déconnecter
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/jobs">Offres</Link>
            <Link href="/login">Se connecter</Link>
            <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
              Créer un compte
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
