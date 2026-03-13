"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setStoredToken } from "../../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("demo-supervisor");

  return (
    <main className="app-shell">
      <div className="surface login-card">
        <div className="eyebrow">Demo access</div>
        <h1 className="hero-title" style={{ maxWidth: "10ch", fontSize: "3.4rem" }}>
          Enter the watchtower.
        </h1>
        <p className="hero-copy">
          This scaffold runs in demo auth mode. Choose a role token and step into the live inspection dashboard.
        </p>
        <div className="stack" style={{ marginTop: 18 }}>
          <label>
            <div className="muted" style={{ marginBottom: 8 }}>
              Demo token
            </div>
            <select className="input" value={token} onChange={(event) => setToken(event.target.value)}>
              <option value="demo-admin">demo-admin</option>
              <option value="demo-supervisor">demo-supervisor</option>
              <option value="demo-inspector">demo-inspector</option>
            </select>
          </label>
          <button
            className="button button-primary"
            onClick={() => {
              setStoredToken(token);
              router.push("/dashboard");
            }}
          >
            Launch dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

