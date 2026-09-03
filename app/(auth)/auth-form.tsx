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
    <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
      <GitHubIcon />
      Continue with GitHub
    </Button>
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
    <div className="rounded-3xl border border-line bg-canvas p-8 shadow-float">
      <h1 className="display-sm text-[28px]">
        {isSignUp ? "Create your account" : "Log in"}
      </h1>
      <p className="mt-2 text-[15px] leading-7 text-muted">
        {isSignUp
          ? "Publishing takes a public GitHub repo with a tagged release. Nothing gets uploaded."
          : "Welcome back. Your listings are where you left them."}
      </p>

      <form action={signInWithGitHub} className="mt-7">
        <input type="hidden" name="next" value={next} />
        <GitHubButton />
      </form>

      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[13px] text-faint">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={action} className="space-y-5">
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

        <Submit label={isSignUp ? "Create account" : "Log in"} />
      </form>

      <p className="mt-7 text-center text-[15px] text-muted">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-brand transition-colors hover:text-brand-deep"
        >
          {isSignUp ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
