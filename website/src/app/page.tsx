import type { Metadata } from "next";
import { Features } from "@/components/sections/features";
import { Flow } from "@/components/sections/flow";
import { Hero } from "@/components/sections/hero";
import { VelocitySection } from "@/components/sections/velocity-section";

export const metadata: Metadata = {
  title: "TunePort | YouTube to Spotify Sync",
  description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
  openGraph: {
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
    url: "https://tuneflow.micr.dev",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TunePort | YouTube to Spotify Sync",
    description: "Sync YouTube to Spotify with zero friction. Match tracks, add to playlists, and download audio locally.",
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <VelocitySection />
      <Flow />
    </>
  );
}