"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-client";
import {
  createMyCandidateProfile,
  getMyCandidateProfile,
  updateMyCandidateProfile,
} from "./api";

const schema = z.object({
  fullName: z.string().min(2, "2 caractères minimum"),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CandidateProfileForm({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: () => getMyCandidateProfile(accessToken),
    retry: false,
  });
  const profile = query.data;
  const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", title: "", bio: "", skills: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        title: profile.title ?? "",
        bio: profile.bio ?? "",
        skills: profile.skills.join(", "),
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const skills = values.skills
        ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const body = { ...values, skills };
      return profile
        ? updateMyCandidateProfile(accessToken, body)
        : createMyCandidateProfile(accessToken, body);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["candidateProfile"], data);
    },
  });

  if (query.isLoading) {
    return null;
  }
  if (query.isError && !notFound) {
    return <p className="text-destructive text-sm">Erreur de chargement du profil</p>;
  }

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && (
          <p className="text-destructive text-sm">{errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" placeholder="Développeur Full Stack" {...register("title")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" {...register("bio")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
        <Input id="skills" placeholder="React, Node.js, Docker" {...register("skills")} />
      </div>

      {mutation.isError && (
        <p className="text-destructive text-sm">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Une erreur est survenue"}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Profil enregistré.</p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Enregistrement..."
          : profile
            ? "Mettre à jour"
            : "Créer mon profil"}
      </Button>
    </form>
  );
}
