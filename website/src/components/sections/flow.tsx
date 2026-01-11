"use client";

import React, { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { FileAudio, Music, Youtube, Zap } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:bg-black",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function Flow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);

  return (
    <section className="container py-24 sm:py-32">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
          Seamless Integration
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          How TunePort bridges your streaming services with a single click.
        </p>
      </div>

      <div
        className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl mt-12"
        ref={containerRef}
      >
        <div className="flex size-full flex-col max-w-lg max-h-[200px] items-stretch justify-between gap-10">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <Circle ref={div1Ref}>
                <Youtube className="size-6 text-[#FF0000]" />
              </Circle>
              <span className="text-sm font-medium">Detect</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <Circle ref={div4Ref}>
                <Zap className="size-6 text-yellow-500 fill-yellow-500" />
              </Circle>
              <span className="text-sm font-medium">TunePort</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Circle ref={div2Ref}>
                <Music className="size-6 text-[#1DB954]" />
              </Circle>
              <span className="text-sm font-medium">Match</span>
            </div>
          </div>
          <div className="flex flex-row items-center justify-center">
             <div className="flex flex-col items-center gap-2">
              <Circle ref={div3Ref}>
                <FileAudio className="size-6 text-blue-500" />
              </Circle>
              <span className="text-sm font-medium">Sync & Download</span>
            </div>
          </div>
        </div>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div1Ref}
          toRef={div4Ref}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div4Ref}
          toRef={div2Ref}
        />
         <AnimatedBeam
          containerRef={containerRef}
          fromRef={div4Ref}
          toRef={div3Ref}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-center">
        <div className="space-y-2">
            <h3 className="font-bold text-xl">1. Detect</h3>
            <p className="text-muted-foreground">
                TunePort automatically identifies the video you're watching on YouTube.
            </p>
        </div>
        <div className="space-y-2">
             <h3 className="font-bold text-xl">2. Match</h3>
            <p className="text-muted-foreground">
                Our smart algorithms find the exact match on Spotify, filtering out covers and remixes.
            </p>
        </div>
        <div className="space-y-2">
             <h3 className="font-bold text-xl">3. Sync & Download</h3>
            <p className="text-muted-foreground">
                Instantly add to your playlist and download the high-quality audio file simultaneously.
            </p>
        </div>
      </div>
    </section>
  );
}
