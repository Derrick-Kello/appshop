import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to publish and manage your Mac apps on Appshop.",
};

const NOTICES: Record<string, string> = {
  oauth: "GitHub sign-in didn't complete. Try again, or use an email and password.",
  "not-configured":
    "Accounts are not switched on yet. Add your Appwrite project to .env.local first.",
};

export default async function SignInPage(props: PageProps<"/sign-in">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const error = typeof params.error === "string" ? params.error : "";

  return <AuthForm mode="sign-in" next={next} notice={NOTICES[error]} />;
}
