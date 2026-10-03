import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const databaseReady = Boolean(process.env.DATABASE_URL);
  const googleReady = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <main className="login-shell">
      <section className="login-card">
        <a className="brand login-brand" href="/" aria-label="SIP Compass home">
          <span className="brand-mark"><span className="brand-target">◎</span></span>
          <span>SIP<span className="brand-light">Compass</span></span>
        </a>
        <div className="login-copy">
          <div className="eyebrow">YOUR FINANCIAL CO-PILOT</div>
          <h1>A clearer next step starts with you.</h1>
          <p>Sign in securely to review your SIP decision context. You stay in control of every investment decision.</p>
        </div>
        {databaseReady && googleReady ? <GoogleSignInButton /> : <div className="login-setup" role="status">
          {!databaseReady ? "Add a PostgreSQL DATABASE_URL to .env and apply the Prisma schema before signing in." : "Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env to enable Google sign-in."}
        </div>}
        <div className="login-privacy">Your account is used to identify your private data. This demo does not connect to an investment provider.</div>
      </section>
    </main>
  );
}
