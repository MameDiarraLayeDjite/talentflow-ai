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

const COMPANY_LINKS: DashboardLink[] = [
  {
    href: "/profile",
    label: "Mon profil",
    description: "Nom, secteur, description",
    icon: User,
  },
  {
    href: "/jobs/new",
    label: "Publier une offre",
    description: "Visible immédiatement",
    icon: PlusCircle,
  },
  {
    href: "/jobs/mine",
    label: "Mes offres",
    description: "Gérer tes offres et candidatures reçues",
    icon: Briefcase,
  },
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

  const links = user.role === "CANDIDATE" ? CANDIDATE_LINKS : COMPANY_LINKS;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour {user.email.split("@")[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            {ROLE_LABEL[user.role] ?? user.role} · {user.email}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          Se déconnecter
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
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
    </main>
  );
}
