"use client";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const LightningIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="url(#lightning-gradient)" stroke="url(#lightning-stroke)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="lightning-gradient" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" stopOpacity="0.2"/>
        <stop offset="1" stopColor="#FCD34D" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="lightning-stroke" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B"/>
        <stop offset="1" stopColor="#FCD34D"/>
      </linearGradient>
    </defs>
  </svg>
);

const AudioIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="8" width="2" height="8" rx="1" fill="#10B981" fillOpacity="0.8"/>
    <rect x="8" y="4" width="2" height="16" rx="1" fill="#10B981" fillOpacity="0.6"/>
    <rect x="12" y="6" width="2" height="12" rx="1" fill="#10B981" fillOpacity="0.8"/>
    <rect x="16" y="10" width="2" height="4" rx="1" fill="#10B981" fillOpacity="0.6"/>
    <rect x="20" y="8" width="2" height="8" rx="1" fill="#10B981" fillOpacity="0.8"/>
  </svg>
);

const MatchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 12L11 14L15 10" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="9" stroke="#3B82F6" strokeWidth="2" strokeOpacity="0.3"/>
    <circle cx="12" cy="12" r="4" fill="#3B82F6" fillOpacity="0.1"/>
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#shield-gradient)" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="shield-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1" stopOpacity="0.1"/>
        <stop offset="1" stopColor="#818CF8" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
  </svg>
);

function InstantSyncBackground() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-60">
      <div className="relative">
        <motion.div
          className="absolute -inset-4 rounded-full bg-amber-400/20 blur-xl"
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
        <LightningIcon className="h-24 w-24" />
      </div>
    </div>
  );
}

function LosslessAudioBackground() {
  return (
    <div className="flex h-full w-full items-end justify-center gap-2 pb-8 opacity-60">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-4 rounded-t-md bg-emerald-400"
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
    <div className="flex h-full w-full flex-col items-center justify-center opacity-50">
        <Marquee className="[--duration:20s]" pauseOnHover reverse>
            {Array(5).fill(0).map((_, i) => (
                 <div key={i} className="flex gap-4">
                     <span className="bg-rose-50 px-2 text-rose-500 line-through">Official Video</span>
                     <span className="bg-rose-50 px-2 text-rose-500 line-through">Lyrics</span>
                     <span className="bg-rose-50 px-2 text-rose-500 line-through">HD</span>
                 </div>
            ))}
        </Marquee>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 font-mono text-sm font-bold text-blue-600">
            <MatchIcon className="h-4 w-4" />
            <span>MATCH FOUND</span>
        </div>
    </div>
  );
}

function PrivacyFirstBackground() {
  return (
    <div className="flex h-full w-full items-center justify-center opacity-60">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px 0px rgba(99, 102, 241, 0.1)",
            "0 0 40px 10px rgba(99, 102, 241, 0.2)",
            "0 0 20px 0px rgba(99, 102, 241, 0.1)",
          ],
        }}
        transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }}
        className="rounded-full p-8"
      >
        <ShieldIcon className="h-24 w-24" />
      </motion.div>
    </div>
  );
}

const features = [
  {
    Icon: LightningIcon,
    name: "Instant Sync",
    description: "Right-click any video to add it to your playlist. Zero friction.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1 bg-white shadow-xl hover:shadow-2xl transition-all rounded-xl border-none",
    background: <InstantSyncBackground />,
  },
  {
    Icon: AudioIcon,
    name: "Lossless Audio",
    description: "Prioritizes FLAC from Lucida (Qobuz/Tidal) or falls back to high-quality Opus.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2 bg-white shadow-xl hover:shadow-2xl transition-all rounded-xl border-none",
    background: <LosslessAudioBackground />,
  },
  {
    Icon: MatchIcon,
    name: "Smart Matching",
    description: "Fuzzy matching algorithm handles 'Official Video' and 'Lyrics' noise automatically.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2 bg-white shadow-xl hover:shadow-2xl transition-all rounded-xl border-none",
    background: <SmartMatchingBackground />,
  },
  {
    Icon: ShieldIcon,
    name: "Privacy First",
    description: "Runs entirely in your browser. No backend servers, no data collection.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1 bg-white shadow-xl hover:shadow-2xl transition-all rounded-xl border-none",
    background: <PrivacyFirstBackground />,
  },
];

export function Features() {
  return (
    <section className="container mx-auto py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl md:text-5xl">
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