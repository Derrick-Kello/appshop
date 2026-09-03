import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create an Appshop account and publish Mac apps straight from GitHub.",
};

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  if (await getCurrentUser()) redirect("/dashboard");

  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";

  return <AuthForm mode="sign-up" next={next} />;
}
