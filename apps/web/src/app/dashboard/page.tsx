"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

const ROLE_LABEL: Record<string, string> = {
  CANDIDATE: "Candidat",
  COMPANY: "Entreprise",
};

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Bienvenue</CardTitle>
          <CardDescription>Ton tableau de bord TalentFlow AI</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm">
            <p>
              <span className="text-muted-foreground">Email : </span>
              {user.email}
            </p>
            <p>
              <span className="text-muted-foreground">Rôle : </span>
              {ROLE_LABEL[user.role] ?? user.role}
            </p>
          </div>
          <Button variant="outline" onClick={() => logout()}>
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
