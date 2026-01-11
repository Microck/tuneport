"use client";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { FileAudio, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

function InstantSyncBackground() {
  return (
    <div className="flex h-48 w-full items-center justify-center opacity-40">
      <div className="relative">
        <motion.div
          className="absolute -inset-4 rounded-full bg-emerald-400/20 blur-xl"
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
        <Zap className="h-24 w-24 text-emerald-500" />
      </div>
    </div>
  );
}

function LosslessAudioBackground() {
  return (
    <div className="flex h-48 w-full items-end justify-center gap-2 pb-8 opacity-40">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-4 rounded-t-md bg-emerald-500"
          animate={{
            height: [20, 40 + Math.random() * 60, 20],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{ height: 40 }}
        />
      ))}
    </div>
  );
}

function SmartMatchingBackground() {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center opacity-60 mask-image-fade">
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black" />
      <div className="relative flex w-full flex-col gap-2 overflow-hidden py-4">
          <Marquee className="[--duration:20s]" pauseOnHover reverse>
              {Array(5).fill(0).map((_, i) => (
                   <div key={i} className="flex gap-4 opacity-50">
                       <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400 line-through">Official Video</span>
                       <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400 line-through">Lyrics</span>
                       <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-400 line-through">HD</span>
                   </div>
              ))}
          </Marquee>
          <div className="z-20 mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 font-mono text-sm font-bold text-emerald-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>MATCH FOUND</span>
          </div>
      </div>
    </div>
  );
}

function PrivacyFirstBackground() {
  return (
    <div className="flex h-48 w-full items-center justify-center opacity-40">
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
        className="rounded-full p-8 border border-emerald-100 bg-emerald-50/50"
      >
        <ShieldCheck className="h-24 w-24 text-emerald-500" />
      </motion.div>
    </div>
  );
}

const features = [
  {
    Icon: Zap,
    name: "Instant Sync",
    description: "Right-click any video to add it to your playlist. Zero friction.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1 bg-white shadow-lg hover:shadow-xl transition-all rounded-xl border border-slate-100",
    background: <InstantSyncBackground />,
  },
  {
    Icon: FileAudio,
    name: "Lossless Audio",
    description: "Prioritizes FLAC from Lucida (Qobuz/Tidal) or falls back to high-quality Opus.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2 bg-white shadow-lg hover:shadow-xl transition-all rounded-xl border border-slate-100",
    background: <LosslessAudioBackground />,
  },
  {
    Icon: Sparkles,
    name: "Smart Matching",
    description: "Fuzzy matching algorithm handles 'Official Video' and 'Lyrics' noise automatically.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2 bg-white shadow-lg hover:shadow-xl transition-all rounded-xl border border-slate-100",
    background: <SmartMatchingBackground />,
  },
  {
    Icon: ShieldCheck,
    name: "Privacy First",
    description: "Runs entirely in your browser. No backend servers, no data collection.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1 bg-white shadow-lg hover:shadow-xl transition-all rounded-xl border border-slate-100",
    background: <PrivacyFirstBackground />,
  },
  ];

export function Features() {
  return (
    <section className="container mx-auto py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl md:text-5xl">
        Built for Speed & Quality
      </h2>
      <BentoGrid className="auto-rows-[20rem]">
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
