"use client";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { AudioWaveform, BrainCircuit, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function InstantSyncBackground() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-40">
      <div className="relative">
        <motion.div
          className="absolute -inset-4 rounded-full bg-yellow-500/20 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Zap className="h-24 w-24 text-yellow-500" />
      </div>
    </div>
  );
}

function LosslessAudioBackground() {
  return (
    <div className="flex h-full w-full items-end justify-center gap-2 pb-8 opacity-40">
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
  const [text, setText] = useState("Artist - Title");
  
  useEffect(() => {
    const texts = [
      "Official Video",
      "Lyrics",
      "Remix",
      "Ft. Artist",
      "4K HD",
      "Live",
    ];
    let i = 0;
    const interval = setInterval(() => {
      setText(texts[i % texts.length]);
      i++;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center opacity-30">
        <Marquee className="[--duration:20s]" pauseOnHover reverse>
            {Array(5).fill(0).map((_, i) => (
                 <div key={i} className="flex gap-4">
                     <span className="bg-red-500/10 px-2 text-red-500 line-through">Official Video</span>
                     <span className="bg-red-500/10 px-2 text-red-500 line-through">Lyrics</span>
                     <span className="bg-red-500/10 px-2 text-red-500 line-through">HD</span>
                 </div>
            ))}
        </Marquee>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-green-500/10 px-4 py-2 font-mono text-sm font-bold text-green-500">
            <BrainCircuit className="h-4 w-4" />
            <span>MATCH FOUND</span>
        </div>
    </div>
  );
}

function PrivacyFirstBackground() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-40">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px 0px rgba(59, 130, 246, 0.1)",
            "0 0 40px 10px rgba(59, 130, 246, 0.3)",
            "0 0 20px 0px rgba(59, 130, 246, 0.1)",
          ],
        }}
        transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className="rounded-full p-8"
      >
        <Shield className="h-24 w-24 text-blue-500" />
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
    className: "col-span-3 lg:col-span-1",
    background: <InstantSyncBackground />,
  },
  {
    Icon: AudioWaveform,
    name: "Lossless Audio",
    description: "Prioritizes FLAC from Lucida (Qobuz/Tidal) or falls back to high-quality Opus.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <LosslessAudioBackground />,
  },
  {
    Icon: BrainCircuit,
    name: "Smart Matching",
    description: "Fuzzy matching algorithm handles 'Official Video' and 'Lyrics' noise automatically.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: <SmartMatchingBackground />,
  },
  {
    Icon: Shield,
    name: "Privacy First",
    description: "Runs entirely in your browser. No backend servers, no data collection.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: <PrivacyFirstBackground />,
  },
];

export function Features() {
  return (
    <section className="container mx-auto py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
        Built for Speed & Quality
      </h2>
      <BentoGrid>
        {features.map((feature, idx) => (
          <BentoCard key={idx} {...feature} />
        ))}
      </BentoGrid>
    </section>
  );
}
