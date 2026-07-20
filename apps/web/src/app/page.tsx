import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">TalentFlow AI</h1>
      <p className="text-muted-foreground max-w-md text-lg">
        La plateforme de recrutement qui utilise l&apos;IA pour aider les
        entreprises à recruter plus vite et les candidats à mieux postuler.
      </p>
      <div className="flex gap-4">
        <Button nativeButton={false} render={<Link href="/register" />}>
          Créer un compte
        </Button>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/login" />}
        >
          Se connecter
        </Button>
      </div>
    </main>
  );
}
