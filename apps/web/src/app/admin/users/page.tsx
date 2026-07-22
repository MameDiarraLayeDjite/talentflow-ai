"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  deleteAdminUser,
  listAdminUsers,
  type AdminUser,
} from "@/features/admin/api";
import type { UserRole } from "@talentflow/types";

const PAGE_SIZE = 20;

const ROLE_FILTERS: { label: string; value: UserRole | undefined }[] = [
  { label: "Tous", value: undefined },
  { label: "Candidats", value: "CANDIDATE" },
  { label: "Entreprises", value: "COMPANY" },
  { label: "Admins", value: "ADMIN" },
];

const ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE: "Candidat",
  COMPANY: "Entreprise",
  ADMIN: "Admin",
};

export default function AdminUsersPage() {
  const { user, isLoading, accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const query = useQuery({
    queryKey: ["adminUsers", role, page],
    queryFn: () =>
      listAdminUsers(accessToken!, { role, page, limit: PAGE_SIZE }),
    enabled: !!accessToken && user?.role === "ADMIN",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(accessToken!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      setPendingDelete(null);
    },
  });

  if (isLoading || !user || user.role !== "ADMIN") {
    return null;
  }

  const users = query.data?.items ?? [];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <div>
        <Link href="/admin" className="text-muted-foreground text-sm">
          ← Administration
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Utilisateurs
        </h1>
        <p className="text-muted-foreground text-sm">
          {query.data
            ? `${query.data.total} utilisateur${query.data.total > 1 ? "s" : ""}`
            : "Gérer les comptes de la plateforme"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => {
              setRole(f.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              role === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Chargement...
        </div>
      )}

      {query.data && users.length === 0 && (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Aucun utilisateur ne correspond à ce filtre.
        </p>
      )}

      {users.length > 0 && (
        <Card className="gap-0 divide-y p-0 shadow-sm">
          {users.map((u) => {
            const displayName =
              u.candidateProfile?.fullName ?? u.companyProfile?.name ?? null;
            const isSelf = u.id === user.sub;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {displayName ?? u.email}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {displayName ? `${u.email} · ` : ""}
                    {ROLE_LABEL[u.role]}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSelf || deleteMutation.isPending}
                  onClick={() => setPendingDelete(u)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </Button>
              </div>
            );
          })}
        </Card>
      )}

      {query.data && query.data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Précédent
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {query.data.page} / {query.data.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= query.data.totalPages}
            onClick={() =>
              setPage((p) => Math.min(query.data!.totalPages, p + 1))
            }
          >
            Suivant
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.email} sera définitivement supprimé, ainsi que
              son profil, ses candidatures et ses offres associées. Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
