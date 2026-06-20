import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { getServerSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-layout">
        <div className="auth-copy">
          <div className="auth-brand">
            <span className="brand-mark auth-brand-mark">SI</span>
            <span>SimpleInvoice</span>
          </div>
          <div>
            <h1 className="auth-headline">Secure invoice operations</h1>
            <p className="auth-lede">
              A focused workspace for reviewing, filtering and creating assessment invoices through a protected BFF flow.
            </p>
          </div>
          <div className="auth-proof-grid" aria-label="Security highlights">
            <span>Server-side token exchange</span>
            <span>httpOnly cookie session</span>
            <span>Protected invoice APIs</span>
          </div>
        </div>

        <section className="auth-panel" aria-label="Sign in">
          <LoginForm />
        </section>
      </section>
    </main>
  );
}
