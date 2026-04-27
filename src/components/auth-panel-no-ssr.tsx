"use client";

import dynamic from "next/dynamic";

export const AuthPanelNoSSR = dynamic(
  () => import("@/components/auth-panel").then((mod) => mod.AuthPanel),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-2xl p-5">
        <h3 className="mb-4 text-lg font-semibold">Sign in</h3>
        <p className="text-sm text-slate-300">Loading authentication...</p>
      </div>
    ),
  },
);
