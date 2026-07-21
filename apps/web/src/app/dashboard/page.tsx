"use client";

import { useEffect } from "react";
import Link from "next/link";
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

const CANDIDATE_LINKS = [
  { href: "/profile", label: "Mon profil" },
  { href: "/resumes", label: "Mes CV" },
  { href: "/jobs", label: "Chercher une offre" },
  { href: "/applications", label: "Mes candidatures" },
];

const COMPANY_LINKS = [
  { href: "/profile", label: "Mon profil" },
  { href: "/jobs/new", label: "Publier une offre" },
  { href: "/jobs/mine", label: "Mes offres" },
];

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
          <div className="flex flex-col gap-2">
            {(user.role === "CANDIDATE" ? CANDIDATE_LINKS : COMPANY_LINKS).map(
              (link) => (
                <Button
                  key={link.href}
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                >
                  {link.label}
                </Button>
              ),
            )}
          </div>

          <Button variant="ghost" onClick={() => logout()}>
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
