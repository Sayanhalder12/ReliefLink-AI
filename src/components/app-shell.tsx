"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HeartHandshake, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/ngo", label: "NGO" },
  { href: "/ngo/upload", label: "Upload" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/analytics", label: "Analytics" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-4 pb-12 sm:px-8">
      <header className="sticky top-4 z-30 mx-auto mt-4 max-w-6xl glass rounded-2xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartHandshake className="size-5 text-cyan-300" />
            <span>ReliefLink AI</span>
          </Link>
          <nav className="hidden gap-2 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  pathname === link.href
                    ? "bg-white/20"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          ) : (
            <span className="text-xs text-slate-300">Please login to continue</span>
          )}
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto mt-8 max-w-6xl"
      >
        {children}
      </motion.main>
    </div>
  );
}
