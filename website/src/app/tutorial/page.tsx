"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle, Settings, CheckCircle, Download, LayoutTemplate, Link as LinkIcon, Key, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { Meteors } from "@/components/ui/meteors";
import { TextAnimate } from "@/components/ui/text-animate";
import { Highlighter } from "@/components/ui/highlighter";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

export default function TutorialPage() {
  const [copied, setCopied] = useState(false);
  const redirectUri = "https://<extension-id>.chromiumapp.org/";

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-white pb-12 pt-20 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Meteors number={20} />
      </div>
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-rose-600" data-animate="button">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex flex-col items-start sm:items-end gap-1">
              <Button className="h-10 px-5" disabled data-placeholder="webstore-url" data-animate="button">Chrome Web Store soon</Button>
            </div>
        </div>

        <div className="relative mb-10 text-center">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 backdrop-blur-md mb-6" data-animate="text" data-animate-variant="slide-down">
                Getting Started
            </div>
            
          <TextAnimate animation="blurInUp" by="word" className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl md:text-6xl mb-6">
            TunePort Tutorial
          </TextAnimate>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed" data-animate="text" data-animate-variant="fade">
             From YouTube to Spotify in{" "}
             <Highlighter action="underline" color="#93C5FD" isView>
               four steps
             </Highlighter>
             . No accounts, no friction,{" "}
             <Highlighter action="underline" color="#FDE68A" isView>
               purely local
             </Highlighter>
             .
          </p>
        </div>

        <div className="relative mb-10 rounded-2xl bg-white/50 p-1 backdrop-blur-sm">
            <ShineBorder shineColor={["#3B82F6", "#8B5CF6"]} className="rounded-2xl" borderWidth={1.5}>
                <div className="rounded-xl bg-white/80 p-8 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900 flex items-center gap-2" data-animate="text" data-animate-variant="slide-up">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Prerequisites
                    </h3>
                    <ul className="grid gap-3 sm:grid-cols-3">
                        <li className="flex items-center gap-2 text-slate-600 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                            Chrome Extension installed
                        </li>
                        <li className="flex items-center gap-2 text-slate-600 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                            Logged into Spotify (Web)
                        </li>
                        <li className="flex items-center gap-2 text-slate-600 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                            YouTube video open
                        </li>
                    </ul>
                </div>
            </ShineBorder>
        </div>

        <div className="mb-10">
             <BentoGrid className="lg:auto-rows-[18rem]">
                <BentoCard
                    name="1. Install"
                    className="col-span-3 lg:col-span-1"
                    background={<div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent opacity-50" />}
                    Icon={Download}
                    description="Download the latest TunePort release, unzip it, and load it via chrome://extensions (Developer Mode)."
                    href="https://github.com/Microck/tuneport/releases"
                    cta="Download Release"
                />
                <BentoCard
                    name="2. Create App"
                    className="col-span-3 lg:col-span-1"
                    background={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />}
                    Icon={LayoutTemplate}
                    description="Go to the Spotify Developer Dashboard to create a new app. This gives you unlimited API access."
                    href="https://developer.spotify.com/dashboard"
                    cta="Open Dashboard"
                />
                <BentoCard
                    name="3. Redirect URI"
                    className="col-span-3 lg:col-span-1"
                    background={<div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />}
                    Icon={LinkIcon}
                    description={`Add "chrome-extension://<extension-id>/popup/auth-callback.html" to your app settings. Find your ID in the extension.`}
                    cta={copied ? "Copied!" : "Copy URI Template"}
                    onClick={handleCopy}
                />
                <BentoCard
                    name="4. Client ID"
                    className="col-span-3 lg:col-span-1"
                    background={<div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100 opacity-50" />}
                    Icon={Key}
                    description="Copy the Client ID from your new Spotify App and paste it into the TunePort extension setup screen."
                    cta="Read Full Docs"
                    href="/docs"
                />
                <BentoCard
                    name="5. Bridge Mode (Optional)"
                    className="col-span-3"
                    background={<div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-orange-100 opacity-50" />}
                    Icon={Settings}
                    description="Want to sync Local Files? Install Spicetify and enable Bridge Mode in extension settings. The extension will guide you through the setup."
                    cta="View Self-Host Guide"
                    href="/self-host"
                />
            </BentoGrid>
        </div>

        <div className="mb-20">
            <h2 className="mb-6 text-xl font-bold text-slate-900 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-slate-700" />
                Video Tutorial
            </h2>
            <HeroVideoDialog
                animationStyle="from-center"
                videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ" // TODO: Replace with actual tutorial video
                thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png" // Placeholder thumbnail
                thumbnailAlt="TunePort Tutorial Walkthrough"
                className="w-full rounded-xl border border-slate-200 shadow-sm"
            />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 md:p-10">
            <h2 className="mb-6 text-xl font-bold text-slate-900 flex items-center gap-2" data-animate="text" data-animate-variant="slide-left">
                <Settings className="h-5 w-5 text-slate-700" />
                Troubleshooting
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900" data-animate="text" data-animate-variant="fade">Track not found?</h3>
                    <p className="text-sm text-slate-600" data-animate="text" data-animate-variant="fade">Ensure the YouTube video title contains both the Artist and Track Name clearly. Remixes with complex titles might need manual adjustment.</p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900" data-animate="text" data-animate-variant="slide-up">No Context Menu?</h3>
                    <p className="text-sm text-slate-600" data-animate="text" data-animate-variant="fade">If the &quot;Add to TunePort&quot; option doesn&apos;t appear, try refreshing the YouTube page once after installation.</p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900" data-animate="text" data-animate-variant="slide-down">Download Failed?</h3>
                    <p className="text-sm text-slate-600" data-animate="text" data-animate-variant="fade">Check your internet connection. Downloads are processed locally in your browser.</p>
                </div>
            </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/docs">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" data-animate="button">
                  <PlayCircle className="h-4 w-4" />
                  Read the Docs
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2" data-animate="button">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
              </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}
