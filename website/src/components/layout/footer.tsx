import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full py-12 px-4 md:px-6 mt-20 glass">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.png"
                alt="TunePort Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">TunePort</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Sync YouTube to Spotify with zero friction.
          </p>
        </div>
        
        <nav className="flex gap-6">
          <a
            href="https://github.com/Microck/tuneport"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
          >
            GitHub
          </a>
          <a
            href="https://github.com/Microck/tuneport/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
          >
            Issues
          </a>
          <a
            href="https://github.com/Microck/tuneport/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
          >
            License
          </a>
        </nav>
        
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TunePort. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
