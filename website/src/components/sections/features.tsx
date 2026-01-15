"use client";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { BlurFade } from "@/components/ui/blur-fade";
import { Highlighter } from "@/components/ui/highlighter";
import { Marquee } from "@/components/ui/marquee";
import { motion } from "framer-motion";
import { ScanSearch, ShieldCheck, Zap, FileAudio } from "lucide-react";

function InstantSyncBackground() {
  return (
    <div className="flex h-48 w-full items-center justify-center opacity-90">
      <div className="relative flex flex-col items-center gap-2">
        <motion.div
          className="absolute -inset-4 rounded-full bg-rose-400/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Zap className="h-16 w-16 text-rose-500" />
      </div>
    </div>
  );
}

function LosslessAudioBackground() {
  return (
    <div className="flex h-48 w-full items-center justify-center opacity-90">
        <div className="relative flex flex-col items-center gap-2">
            <div className="flex items-end justify-center gap-1.5 h-16">
                {[...Array(7)].map((_, i) => (
                    <motion.div
                    key={i}
                    className="w-3 rounded-full bg-emerald-500"
                    animate={{
                        height: [20, 40 + (i % 3) * 15, 20],
                    }}
                    transition={{
                        duration: 0.8 + (i % 4) * 0.2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                    style={{ height: 30 }}
                    />
                ))}
            </div>
      </div>
    </div>
  );
}

function SmartMatchingBackground() {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center opacity-90 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black" />
      <div className="relative flex w-full flex-col gap-4 overflow-hidden py-4 items-center">
          <div className="z-20 flex items-center justify-center gap-2 rounded-full bg-rose-100/80 backdrop-blur-sm px-6 py-2 text-sm font-semibold text-rose-700 shadow-sm border border-rose-200/60">
              <ScanSearch className="h-5 w-5" />
              <span>MATCHING...</span>
          </div>
          <Marquee className="[--duration:25s]" pauseOnHover reverse>
              {Array(5).fill(0).map((_, i) => (
                   <div key={i} className="flex gap-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                       <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">Official Video</span>
                       <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">Lyrics</span>
                       <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">Remix</span>
                   </div>
              ))}
          </Marquee>
      </div>
    </div>
  );
}

function PrivacyFirstBackground() {
  return (
    <div className="flex h-48 w-full items-center justify-center opacity-90">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px 0px rgba(16, 185, 129, 0.1)",
            "0 0 40px 10px rgba(16, 185, 129, 0.2)",
            "0 0 20px 0px rgba(16, 185, 129, 0.1)",
          ],
        }}
        transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className="rounded-full p-6 border border-emerald-100 bg-white/50 backdrop-blur-sm"
      >
        <ShieldCheck className="h-16 w-16 text-emerald-500" />
      </motion.div>
    </div>
  );
}

const features = [
  {
    Icon: Zap,
    name: "Instant Sync",
    description: "Right-click any video to add it to your playlist. Zero friction.",
    href: "/tutorial",
    cta: "Start tutorial",
    className: "col-span-3 lg:col-span-1 bg-white shadow-sm hover:shadow-md transition-all rounded-xl border border-slate-200/60",
    background: <InstantSyncBackground />,
  },
  {
    Icon: FileAudio,
    name: "Lossless Audio",
    description: "Prioritizes FLAC from Lucida (Qobuz/Tidal) or falls back to high-quality Opus.",
    href: "/docs",
    cta: "Read docs",
    className: "col-span-3 lg:col-span-2 bg-white shadow-sm hover:shadow-md transition-all rounded-xl border border-slate-200/60",
    background: <LosslessAudioBackground />,
  },
  {
    Icon: ScanSearch,
    name: "Smart Matching",
    description: "Fuzzy matching algorithm handles 'Official Video' and 'Lyrics' noise automatically.",
    href: "/tutorial",
    cta: "See tutorial",
    className: "col-span-3 lg:col-span-2 bg-white shadow-sm hover:shadow-md transition-all rounded-xl border border-slate-200/60",
    background: <SmartMatchingBackground />,
  },
  {
    Icon: ShieldCheck,
    name: "Privacy First",
    description: "Runs entirely in your browser. No backend servers, no data collection.",
    href: "https://github.com/Microck/tuneport",
    cta: "View code",
    className: "col-span-3 lg:col-span-1 bg-white shadow-sm hover:shadow-md transition-all rounded-xl border border-slate-200/60",
    background: <PrivacyFirstBackground />,
  },
  ];

export function Features() {
  return (
    <section className="container mx-auto py-24 px-4 sm:px-6" id="features">
      <div className="mx-auto max-w-2xl text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl md:text-5xl" data-animate="text" data-animate-variant="slide-up">
          Built for{" "}
          <Highlighter action="underline" color="#FCD34D" isView>
            Speed
          </Highlighter>
          {" "}&{" "}
          <Highlighter action="underline" color="#FBCFE8" isView>
            Quality
          </Highlighter>
        </h2>
        <p className="mt-4 text-lg text-slate-600" data-animate="text" data-animate-variant="fade">
            Everything you need to manage your music library without leaving YouTube.
        </p>
      </div>
      
      <BentoGrid className="auto-rows-[22rem]">
        {features.map((feature, idx) => (
          <BlurFade key={idx} delay={0.25 + idx * 0.05} inView>
            <BentoCard {...feature} />
          </BlurFade>
        ))}
      </BentoGrid>
    </section>
  );
}
