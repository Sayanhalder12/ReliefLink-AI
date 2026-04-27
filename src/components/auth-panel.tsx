"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export function AuthPanel() {
  const { user, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return (
      <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        Logged in as {user.email}
      </p>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
    }
  };

  return (
    <form onSubmit={onSubmit} className="glass rounded-2xl p-5">
      <h3 className="mb-4 text-lg font-semibold">
        {isRegister ? "Create account" : "Sign in"}
      </h3>
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-cyan-300"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6)"
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-cyan-300"
          required
          minLength={6}
        />
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-300">
          {isRegister ? "Register" : "Login"}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister((v) => !v)}
          className="text-sm text-slate-200 underline underline-offset-4"
        >
          {isRegister ? "Already have an account?" : "Need an account?"}
        </button>
      </div>
    </form>
  );
}
