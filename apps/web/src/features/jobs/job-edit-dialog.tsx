"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { ApiError } from "@/lib/api-client";
import type { Job } from "@/features/jobs/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  title: z.string().min(2, "2 caractères minimum"),
  description: z.string().min(10, "10 caractères minimum"),
  contractType: z.string().min(1, "Requis"),
  location: z.string().min(1, "Requis"),
  requiredSkills: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export interface JobEditSubmitValues {
  title: string;
  description: string;
  contractType: string;
  location: string;
  requiredSkills: string[];
}

interface JobEditDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JobEditSubmitValues) => Promise<unknown>;
  invalidateQueryKeys: readonly (readonly unknown[])[];
}

export function JobEditDialog({
  job,
  open,
  onOpenChange,
  onSubmit,
  invalidateQueryKeys,
}: JobEditDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({
        title: job.title,
        description: job.description,
        contractType: job.contractType,
        location: job.location,
        requiredSkills: job.requiredSkills.join(", "),
      });
    }
  }, [open, job, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const requiredSkills = values.requiredSkills
        ? values.requiredSkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      return onSubmit({ ...values, requiredSkills });
    },
    onSuccess: () => {
      for (const key of invalidateQueryKeys) {
        queryClient.invalidateQueries({ queryKey: key as unknown[] });
      }
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;offre</DialogTitle>
          <DialogDescription>{job.title}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title">Titre</Label>
            <Input id="edit-title" {...register("title")} />
            {errors.title && (
              <p className="text-destructive text-sm">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" {...register("description")} />
            {errors.description && (
              <p className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-contractType">Type de contrat</Label>
              <Input id="edit-contractType" {...register("contractType")} />
              {errors.contractType && (
                <p className="text-destructive text-sm">
                  {errors.contractType.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-location">Localisation</Label>
              <Input id="edit-location" {...register("location")} />
              {errors.location && (
                <p className="text-destructive text-sm">
                  {errors.location.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-requiredSkills">
              Compétences requises (séparées par des virgules)
            </Label>
            <Input id="edit-requiredSkills" {...register("requiredSkills")} />
          </div>

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
