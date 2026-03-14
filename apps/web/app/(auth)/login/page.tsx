"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../../../lib/api";
import { setStoredToken } from "../../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("supervisor@fieldlens.local");
  const [password, setPassword] = useState("FieldLensSupervisor123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await login({ email, password });
      setStoredToken(response.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="surface login-card">
        <div className="eyebrow">Field access</div>
        <h1 className="hero-title" style={{ maxWidth: "11ch", fontSize: "3.4rem" }}>
          Enter the watchtower.
        </h1>
        <p className="hero-copy">
          Sign in with your FieldLens account to access the live inspection dashboard and semantic search.
        </p>
        <div className="stack" style={{ marginTop: 18 }}>
          <label>
            <div className="muted" style={{ marginBottom: 8 }}>
              Email
            </div>
            <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            <div className="muted" style={{ marginBottom: 8 }}>
              Password
            </div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
          </label>
          {error ? <p className="muted" style={{ color: "#ff9d7a" }}>{error}</p> : null}
          <button className="button button-primary" disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? "Signing in..." : "Launch dashboard"}
          </button>
        </div>
      </div>
    </main>
  );
}
