"use client";

import React, { forwardRef, useRef } from "react";
import Image from "next/image";
import { FileAudio, Plug, CheckCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { TextAnimate } from "@/components/ui/text-animate";
import WordRotate from "@/components/ui/word-rotate";
import { Highlighter } from "@/components/ui/highlighter";
import { motion, LayoutGroup } from "motion/react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S16.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.38 9.841-.719 13.44 1.56.541.3.66.96.301 1.441zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 14.82 1.14.54.3.719.96.42 1.56-.3.48-.96.66-1.44.36z"/>
  </svg>
);

export function Flow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="container mx-auto py-24 sm:py-32" id="how-it-works">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter text-slate-900 md:text-4xl" data-animate="text" data-animate-variant="slide-right">
          <Highlighter action="underline" color="#A7F3D0" isView>
            Seamless
          </Highlighter>{" "}
          Integration
        </h2>
        <LayoutGroup>
          <motion.div 
            layout
            className="flex flex-wrap justify-center items-center gap-x-1.5 w-full text-slate-500 sm:text-lg sm:leading-7" 
            data-animate="text" 
            data-animate-variant="fade"
          >
            <motion.span 
              layout 
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              How TunePort bridges your
            </motion.span>
            <WordRotate
              words={["streaming services", "music library", "playlists"]}
              className="inline-block font-medium text-slate-700"
            />
            <motion.span 
              layout 
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              with a single click.
            </motion.span>
          </motion.div>
        </LayoutGroup>
      </div>

      <div
        className="relative flex min-h-[400px] w-full items-center justify-center overflow-visible rounded-2xl bg-white/60 mt-12 py-16"
        ref={containerRef}
      >
        <div className="flex w-full max-w-4xl flex-col gap-12 px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold mb-1">1</div>
              <Circle ref={div1Ref} className="size-14 border-none shadow-lg">
                <YouTubeIcon className="size-7 text-[#FF0000]" />
              </Circle>
              <span className="text-sm font-semibold text-slate-800">Detect</span>
              <span className="text-xs text-slate-500 text-center max-w-[120px]">Scan source video</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold mb-1">2</div>
              <div className="relative">
                <div className="absolute inset-0 -m-2 rounded-full bg-rose-100/60 blur-md" />
                <Circle ref={div4Ref} className="relative size-20 border-none shadow-xl bg-gradient-to-br from-rose-50 to-white ring-2 ring-rose-200/50">
                   <div className="relative h-12 w-12">
                    <Image 
                      src="/logo.png" 
                      fill 
                      alt="TunePort" 
                      className="object-contain" 
                    />
                  </div>
                </Circle>
              </div>
              <span className="text-sm font-bold text-slate-900">TunePort</span>
              <span className="text-xs text-slate-500 text-center max-w-[140px]">Process & map your library</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold mb-1">3</div>
              <Circle ref={div2Ref} className="size-14 border-none shadow-lg">
                <SpotifyIcon className="size-7 text-[#1DB954]" />
              </Circle>
              <span className="text-sm font-semibold text-slate-800">Match</span>
              <span className="text-xs text-slate-500 text-center max-w-[120px]">Find on Spotify</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-8 py-6">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium text-center mb-4">Optional Actions</p>
              <div className="flex gap-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-400 text-white text-[10px] font-bold mb-1">4a</div>
                  <Circle ref={div3Ref} className="size-12 border-none shadow-md">
                    <FileAudio className="size-6 text-slate-600" />
                  </Circle>
                  <span className="text-sm font-medium text-slate-700">Download</span>
                  <span className="text-xs text-slate-500 text-center max-w-[100px]">Save locally</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-400 text-white text-[10px] font-bold mb-1">4b</div>
                  <Circle ref={div5Ref} className="size-12 border-none shadow-md">
                    <Plug className="size-6 text-violet-500" />
                  </Circle>
                  <span className="text-sm font-medium text-slate-700">Bridge</span>
                  <span className="text-xs text-slate-500 text-center max-w-[100px]">Sync local files</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-2">
              <Circle ref={div6Ref} className="size-14 border-none shadow-lg bg-emerald-50">
                <CheckCircle className="size-7 text-emerald-500" />
              </Circle>
              <span className="text-sm font-semibold text-emerald-700">Synced</span>
              <span className="text-xs text-slate-500">Transfer complete</span>
            </div>
          </div>
        </div>

        {mounted && (
            <>
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div4Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#FF0000"
            gradientStopColor="#E11D48"
            pathWidth={3}
            delay={0}
            />
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div4Ref}
            toRef={div2Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#E11D48"
            gradientStopColor="#1DB954"
            pathWidth={3}
            delay={0.5}
            />
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div4Ref}
            toRef={div3Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#E11D48"
            gradientStopColor="#64748B"
            pathWidth={2}
            delay={1}
            />
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div3Ref}
            toRef={div5Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#64748B"
            gradientStopColor="#8B5CF6"
            pathWidth={2}
            delay={1.5}
            />
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div2Ref}
            toRef={div6Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#1DB954"
            gradientStopColor="#10B981"
            pathWidth={3}
            delay={2}
            />
            <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div6Ref}
            pathColor="rgba(148, 163, 184, 0.4)"
            gradientStartColor="#8B5CF6"
            gradientStopColor="#10B981"
            pathWidth={2}
            delay={2.5}
            />
            </>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16 text-center">
        <div className="space-y-3 px-4">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">1</div>
             <h3 className="font-bold text-lg text-slate-900" data-animate="text" data-animate-variant="fade">Detect</h3>
             <p className="text-slate-500 text-sm leading-relaxed" data-animate="text" data-animate-variant="fade">
                 Identifies the video you&apos;re watching on YouTube.
             </p>
        </div>
        <div className="space-y-3 px-4">
             <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">2</div>
              <h3 className="font-bold text-lg text-slate-900" data-animate="text" data-animate-variant="fade">Match</h3>
             <p className="text-slate-500 text-sm leading-relaxed" data-animate="text" data-animate-variant="fade">
                 Finds the exact track on Spotify, filtering noise.
             </p>
        </div>
        <div className="space-y-3 px-4">
             <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold">3</div>
              <h3 className="font-bold text-lg text-slate-900" data-animate="text" data-animate-variant="fade">Download</h3>
             <p className="text-slate-500 text-sm leading-relaxed" data-animate="text" data-animate-variant="fade">
                 Save high-quality audio locally (FLAC/Opus).
             </p>
        </div>
        <div className="space-y-3 px-4">
             <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 font-bold">4</div>
              <h3 className="font-bold text-lg text-slate-900" data-animate="text" data-animate-variant="fade">Bridge</h3>
             <p className="text-slate-500 text-sm leading-relaxed" data-animate="text" data-animate-variant="fade">
                 Auto-add local files to Spotify via Spicetify.
             </p>
        </div>
      </div>
    </section>
  );
}
