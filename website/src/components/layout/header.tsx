"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-white/70 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" width={32} height={32} alt="TunePort" className="h-8 w-8" />
          <span className="text-lg font-bold text-slate-900">TunePort</span>
        </Link>
      </div>

      <nav className="hidden gap-6 md:flex">
        <a 
          href="#features" 
          onClick={(e) => scrollToSection(e, "features")}
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          Features
        </a>
        <a 
          href="#how-it-works" 
          onClick={(e) => scrollToSection(e, "how-it-works")}
          className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          How it Works
        </a>
      </nav>

      <div className="flex items-center gap-4">
        <Link href="https://github.com/Microck/tuneport/releases" target="_blank">
          <Button size="sm" className="font-medium">
            Add to Chrome
          </Button>
        </Link>
      </div>
    </header>
  );
}