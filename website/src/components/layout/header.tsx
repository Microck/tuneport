"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, ListChecks, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const linkClassName = (active: boolean) =>
    `flex items-center gap-2 text-sm font-medium transition-colors ${active ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`;

  const mobileLinkClassName = (active: boolean) =>
    `flex items-center gap-2 text-sm font-medium ${active ? "text-slate-900" : "text-slate-700"}`;



  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-white/70 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            width={32}
            height={32}
            alt="TunePort"
            className="h-8 w-8"
            priority
            sizes="32px"
          />
          <span className="text-lg font-bold text-slate-900">TunePort</span>
        </Link>
      </div>

      <nav className="hidden gap-6 md:flex">
        <Link
          href="/docs"
          aria-current={pathname === "/docs" ? "page" : undefined}
          className={linkClassName(pathname === "/docs")}
        >
          <BookOpen className="h-4 w-4" />
          Docs
        </Link>
        <Link
          href="/tutorial"
          aria-current={pathname === "/tutorial" ? "page" : undefined}
          className={linkClassName(pathname === "/tutorial")}
        >
          <ListChecks className="h-4 w-4" />
          Tutorial
        </Link>
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex flex-col items-end gap-1">
          <Button size="sm" className="font-medium" disabled data-placeholder="webstore-url">
            Chrome Web Store soon
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 border-b border-slate-100 bg-white/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-3 px-6 py-4">
            <Link
              href="/docs"
              className={mobileLinkClassName(pathname === "/docs")}
              onClick={() => setMobileOpen(false)}
            >
          <BookOpen className="h-4 w-4" />
          Docs
            </Link>
            <Link
              href="/tutorial"
              className={mobileLinkClassName(pathname === "/tutorial")}
              onClick={() => setMobileOpen(false)}
            >
          <ListChecks className="h-4 w-4" />
          Tutorial
            </Link>
            <div className="pt-2">
              <Button size="sm" className="w-full" disabled data-placeholder="webstore-url">
                Chrome Web Store soon
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}