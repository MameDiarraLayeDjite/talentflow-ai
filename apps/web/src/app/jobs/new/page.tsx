"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { createJob } from "@/features/jobs/api";

const schema = z.object({
  title: z.string().min(2, "2 caractères minimum"),
  description: z.string().min(10, "10 caractères minimum"),
  contractType: z.string().min(1, "Requis"),
  location: z.string().min(1, "Requis"),
  requiredSkills: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function NewJobPage() {
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

  return <NewJobForm accessToken={accessToken} />;
}

function NewJobForm({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const requiredSkills = values.requiredSkills
        ? values.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      return createJob(accessToken, { ...values, requiredSkills });
    },
    onSuccess: (job) => {
      router.push(`/jobs/${job.id}`);
    },
  });

  return (
    <main className="flex flex-1 justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Publier une offre</CardTitle>
          <CardDescription>L&apos;offre est visible immédiatement.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-destructive text-sm">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
              {errors.description && (
                <p className="text-destructive text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contractType">Type de contrat</Label>
              <Input id="contractType" placeholder="CDI" {...register("contractType")} />
              {errors.contractType && (
                <p className="text-destructive text-sm">
                  {errors.contractType.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Localisation</Label>
              <Input id="location" placeholder="Dakar" {...register("location")} />
              {errors.location && (
                <p className="text-destructive text-sm">{errors.location.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="requiredSkills">
                Compétences requises (séparées par des virgules)
              </Label>
              <Input
                id="requiredSkills"
                placeholder="React, Node.js"
                {...register("requiredSkills")}
              />
            </div>

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Une erreur est survenue"}
              </p>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending ? "Publication..." : "Publier l'offre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
