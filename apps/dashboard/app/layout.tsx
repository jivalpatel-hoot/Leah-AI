import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leah — Pilot Dashboard",
  description: "Internal dashboard for the Hoot specialty care AI voice agent pilot",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <div className="brand">
              <span className="brand-dot">L</span>
              <span>Leah</span>
            </div>
            <nav className="nav">
              <a href="/">Overview</a>
              <a href="/leads">Leads &amp; offers</a>
              <a href="/flagged">Flagged calls</a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
