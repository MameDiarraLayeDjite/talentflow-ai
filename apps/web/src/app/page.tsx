import Link from "next/link";
import { Briefcase, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CANDIDATE_POINTS = [
  "Recherche par mot-clé, localisation et type de contrat",
  "Suivi de tes candidatures en temps réel",
  "Notification à chaque changement de statut",
];

const COMPANY_POINTS = [
  "Publication d'une offre en moins de deux minutes",
  "Pipeline de candidatures : reçue, en revue, entretien, décision",
  "Notification instantanée à chaque nouvelle candidature",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b px-6 py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            Matching CV assisté par IA
          </span>
          <h1 className="text-5xl font-semibold tracking-tight text-balance">
            Recrutez plus vite. Postulez mieux.
          </h1>
          <p className="text-muted-foreground max-w-md text-lg text-balance">
            TalentFlow AI connecte candidats et entreprises avec une
            recherche efficace, un suivi de candidature en temps réel et une
            expérience pensée pour les deux côtés du recrutement.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
              Créer un compte
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/jobs" />}
            >
              <Search className="size-4" />
              Voir les offres
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-16 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <Users className="text-muted-foreground mb-1 size-6" />
            <CardTitle>Pour les candidats</CardTitle>
            <CardDescription>
              Trouve le poste qui te correspond vraiment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {CANDIDATE_POINTS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Briefcase className="text-muted-foreground mb-1 size-6" />
            <CardTitle>Pour les entreprises</CardTitle>
            <CardDescription>
              Gère ton recrutement de la publication à la décision.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {COMPANY_POINTS.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-muted-foreground">·</span>
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="border-t px-6 py-10 text-center">
        <p className="text-muted-foreground text-sm">
          Projet portfolio open-source — construit avec Next.js, NestJS,
          Prisma et PostgreSQL.
        </p>
      </section>
    </main>
  );
}
