import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center" data-animate="text">
        <p className="text-sm font-semibold text-rose-600" data-animate="text">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl" data-animate="text">
          Page not found
        </h1>
        <p className="mt-4 text-base text-slate-600" data-animate="text">
          The page you are looking for doesn’t exist. Jump back to the homepage or follow the tutorial.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row" data-animate="text">
          <Link href="/">
            <Button className="h-11 px-6" data-animate="button">Back to home</Button>
          </Link>
          <Link href="/tutorial">
            <Button variant="outline" className="h-11 px-6" data-animate="button">View tutorial</Button>
          </Link>
          <Link href="https://github.com/Microck/tuneport" target="_blank">
            <Button variant="ghost" className="h-11 px-6" data-animate="button">Open Source on GitHub</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
