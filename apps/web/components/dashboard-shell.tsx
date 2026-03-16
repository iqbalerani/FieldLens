"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLiveFeed } from "../hooks/use-live-feed";
import { fetchCurrentUser } from "../lib/api";
import { getStoredToken } from "../lib/auth";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/inspections", label: "Inspections" },
  { href: "/search", label: "Search" },
  { href: "/analytics", label: "Analytics" },
] as const;

export function DashboardShell({
  heading,
  description,
  children,
}: {
  heading: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const userQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    enabled: Boolean(getStoredToken()),
  });

  useLiveFeed(userQuery.data?.orgId);

  return (
    <div className="app-shell">
      <div className="page-wrap">
        <div className="topbar">
          <div>
            <div className="eyebrow">Field command center</div>
            <div className="brand">FieldLens</div>
          </div>
          <div className="nav-row">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                style={pathname === item.href ? { borderColor: "rgba(240, 135, 0, 0.55)", background: "rgba(240,135,0,0.12)" } : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <section className="hero-panel">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">Amazon Nova inspection flow</div>
              <h1 className="hero-title">{heading}</h1>
              <p className="hero-copy">{description}</p>
            </div>
            <div className="surface">
              <div className="panel-title">Live rhythm</div>
              <p className="panel-copy">
                Mobile capture, AI processing, and dashboard updates are all driven off the same inspection lifecycle.
              </p>
            </div>
          </div>
        </section>

        {children}
      </div>
    </div>
  );
}
