"use client";

import React, { useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { Youtube, ShieldCheck, Music2, CheckCircle2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpicetifyIcon } from "@/components/icons/spicetify";

const Circle = React.forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

Circle.displayName = "Circle";

export function MatchingFlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full max-w-6xl mx-auto items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-10 md:shadow-sm"
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-row items-center justify-between gap-4 md:gap-8 flex-wrap lg:flex-nowrap">
        
        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div1Ref} className="border-red-100 bg-red-50 text-red-600">
             <Youtube className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">YouTube</div>
             <div className="text-[10px] text-slate-500">Source</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div2Ref} className="border-indigo-100 bg-indigo-50 text-indigo-600">
             <ShieldCheck className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">Sanitizer</div>
             <div className="text-[10px] text-slate-500">Clean Title</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div3Ref} className="border-emerald-100 bg-emerald-50 text-emerald-600">
             <Music2 className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">Spotify</div>
             <div className="text-[10px] text-slate-500">API Search</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div4Ref} className="border-amber-100 bg-amber-50 text-amber-600">
             <CheckCircle2 className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">Matcher</div>
             <div className="text-[10px] text-slate-500">Scoring</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div5Ref} className="border-orange-100 bg-orange-50 text-orange-600">
             <SpicetifyIcon className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">Bridge</div>
             <div className="text-[10px] text-slate-500">Relay</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-3 z-10">
           <Circle ref={div6Ref} className="border-blue-100 bg-blue-50 text-blue-600">
             <FolderOpen className="h-8 w-8" />
           </Circle>
           <div className="text-center">
             <div className="text-sm font-bold text-slate-900">Local</div>
             <div className="text-[10px] text-slate-500">Import</div>
           </div>
        </div>

      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        duration={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div3Ref}
        duration={3}
        delay={1.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        duration={3}
        delay={3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
        duration={3}
        delay={4.5}
        gradientStartColor="#F59E0B"
        gradientStopColor="#EA580C"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div6Ref}
        duration={3}
        delay={6}
        gradientStartColor="#EA580C"
        gradientStopColor="#2563EB"
      />
    </div>
  );
}

