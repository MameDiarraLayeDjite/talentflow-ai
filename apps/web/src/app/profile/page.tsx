"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { CandidateProfileForm } from "@/features/candidates/profile-form";
import { CompanyProfileForm } from "@/features/companies/profile-form";

export default function ProfilePage() {
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

  return (
    <main className="flex flex-1 justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
          <CardDescription>
            {user.role === "CANDIDATE"
              ? "Ces informations sont visibles par les entreprises quand tu postules."
              : "Ces informations sont visibles par les candidats sur tes offres."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.role === "CANDIDATE" ? (
            <CandidateProfileForm accessToken={accessToken} />
          ) : (
            <CompanyProfileForm accessToken={accessToken} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
