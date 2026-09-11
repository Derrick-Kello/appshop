import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an Appshop account and publish Mac apps straight from GitHub.",
};

const NOTICES: Record<string, string> = {
  oauth: "GitHub sign-in didn't complete. Try again, or use an email and password.",
  "not-configured":
    "Supabase Auth is not switched on yet. Add your Supabase project keys to .env.local first.",
};

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const error = typeof params.error === "string" ? params.error : "";

  return <AuthForm mode="sign-up" next={next} notice={NOTICES[error]} />;
}
