"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HeartHandshake, LogOut, Menu, Sparkles, UserCircle2, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/ngo", label: "NGO Dashboard" },
  { href: "/ngo/upload", label: "Upload Report" },
  { href: "/volunteer", label: "Volunteer Hub" },
  { href: "/analytics", label: "Analytics" },
  { href: "/about", label: "About" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <div className="min-h-screen px-4 pb-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-2 z-40 mx-auto mt-3 max-w-7xl sm:top-3">
        <div className="glass glow-border rounded-[28px] px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 font-semibold text-white">
              <span className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-200">
                <HeartHandshake className="size-5" />
              </span>
              <span>
                ReliefLink AI
                <span className="mt-0.5 block text-xs font-normal tracking-[0.22em] text-slate-400">
                  Crisis Command Center
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive(link.href)
                      ? "bg-cyan-400/15 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <>
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                    <span className="flex items-center gap-2">
                      <UserCircle2 className="size-4 text-cyan-200" />
                      {user.email ?? "Signed in"}
                    </span>
                  </div>
                  <button onClick={() => logout()} className="btn-secondary px-4 py-2 text-sm">
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/" className="btn-secondary px-4 py-2 text-sm">
                    Sign In
                  </Link>
                  <Link href="/ngo" className="btn-primary px-4 py-2 text-sm">
                    <Sparkles className="size-4" />
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 lg:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          {menuOpen ? (
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 lg:hidden">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    isActive(link.href)
                      ? "bg-cyan-400/15 text-cyan-100"
                      : "bg-white/4 text-slate-300 hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="btn-secondary mt-2 w-full px-4 py-3 text-sm"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Link href="/" onClick={() => setMenuOpen(false)} className="btn-secondary w-full px-4 py-3 text-sm">
                    Sign In
                  </Link>
                  <Link href="/ngo" onClick={() => setMenuOpen(false)} className="btn-primary w-full px-4 py-3 text-sm">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto mt-6 max-w-7xl sm:mt-7"
      >
        {children}
      </motion.main>
    </div>
  );
}
