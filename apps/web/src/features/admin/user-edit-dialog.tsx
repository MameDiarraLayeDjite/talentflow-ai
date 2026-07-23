"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  updateAdminUser,
  updateAdminCandidateProfile,
  updateAdminCompanyProfile,
  type AdminUser,
} from "@/features/admin/api";
import type { UserRole } from "@talentflow/types";

const ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE: "Candidat",
  COMPANY: "Entreprise",
  ADMIN: "Admin",
};

const schema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["CANDIDATE", "COMPANY", "ADMIN"]),
  fullName: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
  companyName: z.string().optional(),
  sector: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface UserEditDialogProps {
  user: AdminUser;
  isSelf: boolean;
  accessToken: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserEditDialog({
  user,
  isSelf,
  accessToken,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        email: user.email,
        role: user.role,
        fullName: user.candidateProfile?.fullName ?? "",
        title: user.candidateProfile?.title ?? "",
        bio: user.candidateProfile?.bio ?? "",
        skills: user.candidateProfile?.skills.join(", ") ?? "",
        companyName: user.companyProfile?.name ?? "",
        sector: user.companyProfile?.sector ?? "",
        description: user.companyProfile?.description ?? "",
      });
    }
  }, [open, user, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await updateAdminUser(accessToken, user.id, {
        email: values.email,
        role: isSelf ? undefined : values.role,
      });

      if (user.candidateProfile) {
        await updateAdminCandidateProfile(accessToken, user.candidateProfile.id, {
          fullName: values.fullName,
          title: values.title || undefined,
          bio: values.bio || undefined,
          skills: values.skills
            ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        });
      }

      if (user.companyProfile) {
        await updateAdminCompanyProfile(accessToken, user.companyProfile.id, {
          name: values.companyName,
          sector: values.sector || undefined,
          description: values.description || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rôle</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSelf}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["CANDIDATE", "COMPANY", "ADMIN"] as UserRole[]).map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {isSelf && (
              <p className="text-muted-foreground text-xs">
                Tu ne peux pas changer ton propre rôle.
              </p>
            )}
          </div>

          {user.candidateProfile && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <p className="text-muted-foreground text-xs font-medium">
                Profil candidat
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-fullName">Nom complet</Label>
                <Input id="user-fullName" {...register("fullName")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-title">Titre</Label>
                <Input id="user-title" {...register("title")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-bio">Bio</Label>
                <Textarea id="user-bio" {...register("bio")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-skills">
                  Compétences (séparées par des virgules)
                </Label>
                <Input id="user-skills" {...register("skills")} />
              </div>
            </div>
          )}

          {user.companyProfile && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <p className="text-muted-foreground text-xs font-medium">
                Profil entreprise
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-companyName">Nom de l&apos;entreprise</Label>
                <Input id="user-companyName" {...register("companyName")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-sector">Secteur</Label>
                <Input id="user-sector" {...register("sector")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-description">Description</Label>
                <Textarea id="user-description" {...register("description")} />
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-destructive text-sm">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : "Une erreur est survenue"}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
