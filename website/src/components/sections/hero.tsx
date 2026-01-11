"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { TextAnimate } from "@/components/ui/text-animate";
import { cn } from "@/lib/utils";

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
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 md:py-24">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
        )}
      />

      <div className="z-10 flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        
        <div className="flex flex-col items-center gap-4">
          <TextAnimate
            animation="blurInUp"
            by="character"
            className="text-4xl font-bold tracking-tighter text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Sync. Download. Disappear.
          </TextAnimate>
          
          <TextAnimate
            animation="fadeIn"
            delay={1}
            className="max-w-[600px] text-lg text-muted-foreground sm:text-xl"
          >
            The missing link between YouTube and Spotify.
          </TextAnimate>

          <div className="mt-4 flex gap-4">
            <Link href="https://github.com/Microck/tuneport/releases" target="_blank">
              <ShimmerButton className="shadow-2xl">
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  Add to Chrome
                </span>
              </ShimmerButton>
            </Link>
          </div>
        </div>

        <div
          className="relative mt-8 w-full max-w-4xl"
          style={{ perspective: "1000px" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl border bg-background/50 shadow-2xl transition-transform ease-out will-change-transform"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transitionDuration: "300ms",
            }}
          >
            <BorderBeam size={250} duration={12} delay={9} />
            <video
              src="/tuneport.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
