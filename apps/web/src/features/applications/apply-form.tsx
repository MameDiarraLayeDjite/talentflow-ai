"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { listMyResumes } from "@/features/resumes/api";
import { applyToJob } from "./api";

export function ApplyForm({
  accessToken,
  jobId,
}: {
  accessToken: string;
  jobId: string;
}) {
  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: () => listMyResumes(accessToken),
  });
  const [resumeId, setResumeId] = useState("");

  const mutation = useMutation({
    mutationFn: () => applyToJob(accessToken, { jobId, resumeId }),
  });

  if (resumesQuery.isLoading) {
    return null;
  }

  if (resumesQuery.data && resumesQuery.data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Ajoute d&apos;abord{" "}
        <Link href="/resumes" className="underline">
          un CV
        </Link>{" "}
        pour pouvoir postuler.
      </p>
    );
  }

  if (mutation.isSuccess) {
    return (
      <p className="text-sm text-green-600">Candidature envoyée !</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <select
        value={resumeId}
        onChange={(e) => setResumeId(e.target.value)}
        className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
      >
        <option value="">Choisis un CV</option>
        {resumesQuery.data?.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.fileUrl}
          </option>
        ))}
      </select>

      {mutation.isError && (
        <p className="text-destructive text-sm">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : "Une erreur est survenue"}
        </p>
      )}

      <Button
        disabled={!resumeId || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Envoi..." : "Postuler"}
      </Button>
    </div>
  );
}
