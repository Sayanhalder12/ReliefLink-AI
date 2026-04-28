"use client";

import { useState } from "react";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ToastMessage } from "@/components/premium-ui";

export function AuthPanel() {
  const { user, login, register, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="glass rounded-[28px] p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-200">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">Workspace Access</p>
            <p className="mt-1 font-medium text-white">Logged in as {user.email}</p>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      setError("");
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="glass rounded-[32px] p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Secure NGO Workspace</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {isRegister ? "Create your operations account" : "Sign in to ReliefLink AI"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Access AI-powered report analysis, volunteer matching, and live crisis response coordination.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
          <LockKeyhole className="size-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="premium-input"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6)"
          className="premium-input"
          required
          minLength={6}
        />
        {error ? <ToastMessage tone="error" message={error} /> : null}
        {loading ? <ToastMessage tone="info" message="Checking your session..." /> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button disabled={busy} className="btn-primary min-w-36 px-5 py-3 text-sm disabled:opacity-70">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {isRegister ? "Create Account" : "Sign In"}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister((v) => !v)}
          className="btn-secondary px-5 py-3 text-sm"
        >
          {isRegister ? "Already have an account?" : "Need an account?"}
        </button>
      </div>
    </form>
  );
}
