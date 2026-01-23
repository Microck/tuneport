"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold text-rose-600">500</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-base text-slate-600">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className="h-11 px-6" onClick={() => reset()}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="h-11 px-6">Back to home</Button>
          </Link>
          <Link href="https://github.com/Microck/tuneport/issues" target="_blank">
            <Button variant="ghost" className="h-11 px-6">Report issue</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
