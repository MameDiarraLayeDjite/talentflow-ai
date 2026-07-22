"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Loader2, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getAdminStats } from "@/features/admin/api";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-4 shadow-sm">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}

export default function AdminPage() {
  const { user, isLoading, accessToken, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const query = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(accessToken!),
    enabled: !!accessToken && user?.role === "ADMIN",
  });

  if (isLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Shield className="text-muted-foreground size-6" />
            Administration
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Se déconnecter
        </Button>
      </div>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement des statistiques...
        </div>
      )}

      {query.data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Utilisateurs" value={query.data.users.total} />
            <StatTile label="Candidats" value={query.data.users.CANDIDATE} />
            <StatTile label="Entreprises" value={query.data.users.COMPANY} />
            <StatTile
              label="Candidatures"
              value={query.data.applications.total}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/admin/users">
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader>
                  <Users className="text-muted-foreground mb-1 size-5" />
                  <CardTitle className="text-base">Utilisateurs</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Gérer les comptes candidats, entreprises et admins
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/jobs">
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader>
                  <Briefcase className="text-muted-foreground mb-1 size-5" />
                  <CardTitle className="text-base">Offres</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {query.data.jobs.total} offre
                  {query.data.jobs.total > 1 ? "s" : ""} · modérer le statut
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
