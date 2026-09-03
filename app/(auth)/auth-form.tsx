"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { GitHubIcon, SpinnerIcon } from "@/components/icons";
import { Button, Field, Input, Notice } from "@/components/ui";

import { signIn, signInWithGitHub, signUp, type AuthState } from "./actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <SpinnerIcon />}
      {pending ? "Just a moment" : label}
    </Button>
  );
}

function GitHubButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-hairline bg-elevated text-sm font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-card disabled:text-ash"
    >
      <GitHubIcon />
      Continue with GitHub
    </button>
  );
}

export function AuthForm({
  mode,
  next,
  notice,
}: {
  mode: "sign-in" | "sign-up";
  next: string;
  notice?: string;
}) {
  const isSignUp = mode === "sign-up";
  const [state, action] = useActionState<AuthState, FormData>(
    isSignUp ? signUp : signIn,
    undefined,
  );

  return (
    <div className="rounded-xl border border-hairline bg-card p-6 shadow-2xl shadow-black/40">
      <h1 className="text-lg font-medium tracking-tight text-ink">
        {isSignUp ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-1 text-[13px] leading-6 text-ash">
        {isSignUp
          ? "Publishing takes a public GitHub repo with a tagged release. Nothing gets uploaded."
          : "Welcome back. Your listings are where you left them."}
      </p>

      <form action={signInWithGitHub} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <GitHubButton />
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-[11px] tracking-wide text-stone uppercase">or</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {isSignUp && (
          <Field label="Name">
            <Input name="name" autoComplete="name" required placeholder="Ada Lovelace" />
          </Field>
        )}

        <Field label="Email">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" hint={isSignUp ? "At least 8 characters." : undefined}>
          <Input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={isSignUp ? 8 : undefined}
            placeholder="Your password"
          />
        </Field>

        {state?.error ? (
          <Notice tone="error">{state.error}</Notice>
        ) : notice ? (
          <Notice tone="error">{notice}</Notice>
        ) : null}

        <Submit label={isSignUp ? "Create account" : "Sign in"} />
      </form>

      <p className="mt-6 text-center text-[13px] text-ash">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="text-ink underline decoration-hairline-strong underline-offset-2 transition-colors hover:decoration-accent-green"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
