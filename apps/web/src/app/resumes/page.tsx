"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { listMyResumes, uploadResume } from "@/features/resumes/api";

function fileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const query = useQuery({
    queryKey: ["resumes"],
    queryFn: () => listMyResumes(accessToken),
  });

  const mutation = useMutation({
    mutationFn: (file: File) => uploadResume(accessToken, file),
    onSuccess: () => {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });

  return (
    <main className="flex flex-1 justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mes CV</CardTitle>
          <CardDescription>
            Envoie un CV au format PDF (5 Mo max). Les compétences sont
            extraites automatiquement pour calculer ton score de
            correspondance avec les offres.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedFile) mutation.mutate(selectedFile);
            }}
            className="flex flex-col gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="text-muted-foreground file:border-input file:bg-background hover:file:bg-muted h-9 w-full rounded-md border border-input px-1 text-sm file:mr-3 file:h-full file:rounded-l-md file:border-0 file:border-r file:px-3 file:text-sm file:font-medium"
            />
            {mutation.isError && (
              <p className="text-destructive text-sm">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Une erreur est survenue"}
              </p>
            )}
            <Button type="submit" disabled={!selectedFile || mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {mutation.isPending ? "Envoi..." : "Envoyer ce CV"}
            </Button>
          </form>

          <div className="flex flex-col gap-3">
            {query.isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Chargement...
              </div>
            )}
            {query.data?.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Aucun CV pour l&apos;instant.
              </p>
            )}
            {query.data?.map((resume) => (
              <div key={resume.id} className="flex flex-col gap-2 rounded-md border p-2.5">
                <a
                  href={resume.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" />
                  <span className="flex-1 truncate">{fileName(resume.fileUrl)}</span>
                  <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
                </a>
                {resume.parsedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {resume.parsedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-muted rounded-full px-2.5 py-0.5 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Aucune compétence détectée automatiquement dans ce CV.
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
