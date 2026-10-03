"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button className="google-sign-in" disabled={busy} onClick={() => {
      setBusy(true);
      void signIn("google", { redirectTo: "/" }).finally(() => setBusy(false));
    }}>
      <span className="google-g" aria-hidden="true">G</span>
      {busy ? "Connecting to Google…" : "Continue with Google"}
    </button>
  );
}
