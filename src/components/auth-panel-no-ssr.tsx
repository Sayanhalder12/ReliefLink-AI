"use client";

import dynamic from "next/dynamic";

export const AuthPanelNoSSR = dynamic(
  () => import("@/components/auth-panel").then((mod) => mod.AuthPanel),
  {
    ssr: false,
    loading: () => (
      <div className="glass rounded-[28px] p-6">
        <h3 className="text-lg font-semibold text-white">Secure sign in</h3>
        <p className="mt-3 text-sm text-slate-300">Loading authentication workspace...</p>
      </div>
    ),
  },
);
