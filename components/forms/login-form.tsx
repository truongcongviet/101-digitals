"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { type LoginInput, loginSchema } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  async function onSubmit(input: LoginInput) {
    setServerError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setServerError(payload?.message ?? "Unable to login");
      return;
    }

    router.replace(searchParams.get("next") ?? "/");
  }

  return (
    <form className="auth-form" method="post" noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <div className="auth-form-header">
        <p className="auth-kicker">101 Digital assessment</p>
        <h2 className="auth-title">Sign in to continue</h2>
        <p className="auth-subtitle">Use the sandbox credentials from the Postman environment.</p>
      </div>

      <FormField label="Username" error={errors.username?.message}>
        <input
          className="input auth-input"
          type="text"
          autoComplete="username"
          placeholder="Sandbox username"
          {...register("username")}
        />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <input
          className="input auth-input"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          {...register("password")}
        />
      </FormField>

      {serverError ? (
        <div className="auth-error">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <button className="button button-primary auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
        <ArrowRight size={17} aria-hidden="true" />
      </button>
    </form>
  );
}
