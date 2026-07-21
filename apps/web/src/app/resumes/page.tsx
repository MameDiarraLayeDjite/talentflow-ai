"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { createResume, listMyResumes } from "@/features/resumes/api";

const schema = z.object({
  fileUrl: z.string().url("Colle un lien valide vers ton CV (PDF)"),
});
type FormValues = z.infer<typeof schema>;

export default function ResumesPage() {
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

  return <ResumesContent accessToken={accessToken} />;
}

function ResumesContent({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["resumes"],
    queryFn: () => listMyResumes(accessToken),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createResume(accessToken, values.fileUrl),
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });

  return (
    <main className="flex flex-1 justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mes CV</CardTitle>
          <CardDescription>
            Ajoute un lien vers ton CV (PDF hébergé en ligne) pour pouvoir
            postuler aux offres.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-2"
          >
            <Label htmlFor="fileUrl">Lien vers le CV</Label>
            <Input
              id="fileUrl"
              placeholder="https://.../cv.pdf"
              {...register("fileUrl")}
            />
            {errors.fileUrl && (
              <p className="text-destructive text-sm">
                {errors.fileUrl.message}
              </p>
            )}
            {mutation.isError && (
              <p className="text-destructive text-sm">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Une erreur est survenue"}
              </p>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Ajout..." : "Ajouter ce CV"}
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            {query.isLoading && (
              <p className="text-muted-foreground text-sm">Chargement...</p>
            )}
            {query.data?.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Aucun CV pour l&apos;instant.
              </p>
            )}
            {query.data?.map((resume) => (
              <a
                key={resume.id}
                href={resume.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                {resume.fileUrl}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
