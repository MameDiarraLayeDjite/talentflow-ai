"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  FileText,
  PlusCircle,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { CompanyStats } from "@/features/applications/company-stats";

const ROLE_LABEL: Record<string, string> = {
  CANDIDATE: "Candidat",
  COMPANY: "Entreprise",
};

interface DashboardLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const CANDIDATE_LINKS: DashboardLink[] = [
  {
    href: "/profile",
    label: "Mon profil",
    description: "Nom, titre, compétences",
    icon: User,
  },
  {
    href: "/resumes",
    label: "Mes CV",
    description: "Gérer tes CV",
    icon: FileText,
  },
  {
    href: "/jobs",
    label: "Chercher une offre",
    description: "Parcourir les offres publiées",
    icon: Search,
  },
  {
    href: "/applications",
    label: "Mes candidatures",
    description: "Suivre l'avancement de tes candidatures",
    icon: ClipboardList,
  },
];

const COMPANY_QUICK_LINKS: DashboardLink[] = [
  {
    href: "/profile",
    label: "Mon profil",
    description: "Nom, secteur, description",
    icon: User,
  },
  {
    href: "/jobs/mine",
    label: "Mes offres",
    description: "Gérer tes offres et candidatures reçues",
    icon: Briefcase,
  },
];

export default function DashboardPage() {
  const { user, isLoading, accessToken, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role === "ADMIN") {
    return null;
  }

  const isCompany = user.role === "COMPANY";

  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-8 p-6 ${
        isCompany ? "max-w-5xl" : "max-w-3xl"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour {user.email.split("@")[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABEL[user.role] ?? user.role} · {user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCompany && (
            <Button size="sm" nativeButton={false} render={<Link href="/jobs/new" />}>
              <PlusCircle className="size-4" />
              Publier une offre
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Se déconnecter
          </Button>
        </div>
      </div>

      {isCompany ? (
        <>
          {accessToken && <CompanyStats accessToken={accessToken} />}

          <div>
            <h2 className="text-muted-foreground mb-3 text-sm font-medium">
              Actions rapides
            </h2>
            <div className="flex flex-wrap gap-2">
              {COMPANY_QUICK_LINKS.map((link) => (
                <Button
                  key={link.href}
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {CANDIDATE_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader>
                  <link.icon className="text-muted-foreground mb-1 size-5" />
                  <CardTitle className="text-base">{link.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  {link.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
