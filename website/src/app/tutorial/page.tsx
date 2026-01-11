import Link from "next/link";
import { Metadata } from "next";
import { ArrowLeft, Download, MousePointerClick, ListMusic, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "TunePort Tutorial",
  description: "Step-by-step guide to install TunePort, match tracks, and sync your library.",
  openGraph: {
    title: "TunePort Tutorial",
    description: "Step-by-step guide to install TunePort, match tracks, and sync your library.",
    url: "https://tuneflow.micr.dev/tutorial",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "TunePort Tutorial",
    description: "Step-by-step guide to install TunePort, match tracks, and sync your library.",
  },
};

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-rose-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex flex-col items-end gap-1">
            <Button className="h-10 px-5" disabled>Chrome Web Store soon</Button>
            <span className="text-xs text-slate-500">Replace URL when published.</span>
          </div>
        </div>

        <section className="bg-white border border-slate-100 rounded-2xl p-8 md:p-10 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            TunePort Tutorial
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            From YouTube to Spotify in four steps. No accounts, no friction.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">1. Install</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Install TunePort from the Chrome Web Store. Pin it to your toolbar for quick access.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <MousePointerClick className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">2. Detect</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Open any YouTube video. Right-click and choose “Add to TunePort.”
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <ListMusic className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">3. Match</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                TunePort finds the best match on Spotify, filtering out covers and remixes automatically.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">4. Sync</h3>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Add to your playlist and download the audio in one step. Everything runs locally.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/research">
              <Button variant="outline" className="h-11 px-6">Read the research</Button>
            </Link>
            <Link href="https://github.com/Microck/tuneport" target="_blank">
              <Button variant="outline" className="h-11 px-6">Open Source on GitHub</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="h-11 px-6">Back to home</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
