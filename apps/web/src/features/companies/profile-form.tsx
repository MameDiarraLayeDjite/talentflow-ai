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
  createMyCompanyProfile,
  getMyCompanyProfile,
  updateMyCompanyProfile,
} from "./api";

const schema = z.object({
  name: z.string().min(2, "2 caractères minimum"),
  sector: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.union([z.string().url("URL invalide"), z.literal("")]).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CompanyProfileForm({ accessToken }: { accessToken: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["companyProfile"],
    queryFn: () => getMyCompanyProfile(accessToken),
    retry: false,
  });
  const profile = query.data;
  const notFound = query.isError && query.error instanceof ApiError && query.error.status === 404;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", sector: "", description: "", logoUrl: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        sector: profile.sector ?? "",
        description: profile.description ?? "",
        logoUrl: profile.logoUrl ?? "",
      });
    }
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = { ...values, logoUrl: values.logoUrl || undefined };
      return profile
        ? updateMyCompanyProfile(accessToken, body)
        : createMyCompanyProfile(accessToken, body);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["companyProfile"], data);
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
        <Label htmlFor="name">Nom de l&apos;entreprise</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sector">Secteur</Label>
        <Input id="sector" placeholder="Tech" {...register("sector")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="logoUrl">URL du logo</Label>
        <Input id="logoUrl" placeholder="https://..." {...register("logoUrl")} />
        {errors.logoUrl && (
          <p className="text-destructive text-sm">{errors.logoUrl.message}</p>
        )}
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
