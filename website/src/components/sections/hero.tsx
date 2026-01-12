"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/ui/text-animate";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = ((centerY - y) / centerY) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] px-4 pt-32 pb-12 md:pb-24">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 mix-blend-multiply opacity-50",
          "text-rose-500/20"
        )}
      />

      <div className="z-10 flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        
          <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/50 px-3 py-1 text-sm font-medium text-rose-600 backdrop-blur-sm" data-animate="text" data-animate-variant="slide-down">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <AnimatedGradientText speed={1.2} colorFrom="#E11D48" colorTo="#10B981">
              Open Source
            </AnimatedGradientText>
          </div>

          <h1 className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-6xl md:text-7xl lg:text-8xl text-balance break-keep hyphens-none">
            <TextAnimate
              animation="blurInUp"
              by="text"
              className="text-inherit"
            >
              Sync. Download. Disappear.
            </TextAnimate>
          </h1>
          
          <TextAnimate
            animation="fadeIn"
            delay={1}
            className="max-w-[600px] text-lg text-slate-600 sm:text-xl text-balance"
          >
            The missing link between YouTube and Spotify.
          </TextAnimate>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex flex-col items-center gap-2">
              <ShimmerButton className="shadow-2xl h-12 px-8 opacity-80 pointer-events-none" data-placeholder="webstore-url" data-animate="button">
                <span className="whitespace-pre-wrap text-center text-base font-semibold leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  Chrome Web Store soon
                </span>
              </ShimmerButton>
            </div>
            
            <Link href="https://github.com/Microck/tuneport" target="_blank">
              <Button variant="outline" className="h-12 px-8 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium" data-animate="button">
                <Github className="mr-2 h-4 w-4" />
                Go to GitHub
              </Button>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600" data-animate="text" data-animate-variant="fade">
            <Link href="/tutorial" className="hover:text-slate-900">Read the tutorial</Link>
            <span className="text-slate-300">•</span>
            <Link href="/docs" className="hover:text-slate-900">Read the docs</Link>
          </div>
        </div>

        <div
          className="relative mt-16 w-full max-w-4xl"
          style={{ perspective: "1000px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-slate-500/10 to-rose-500/20 blur-3xl opacity-60 rounded-[3rem]" />

          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-2xl backdrop-blur-xl transition-transform ease-out will-change-transform"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transitionDuration: "300ms",
            }}
          >
            <BorderBeam size={250} duration={12} delay={9} className="opacity-50 from-emerald-500 via-rose-500 to-emerald-500" />
            <video
              src="/tuneport.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/logo.png"
              aria-label="TunePort demo showing YouTube to Spotify sync"
              className="h-full w-full object-cover rounded-2xl"
            />
            
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
