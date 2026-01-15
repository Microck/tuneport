import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2, GitBranch, ShieldCheck, Timer, Type, User, AlertCircle, FileAudio, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import RetroGrid from "@/components/ui/retro-grid";
import { TextAnimate } from "@/components/ui/text-animate";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
import { MatchingFlowDiagram } from "@/components/diagrams/matching-flow";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How It Works | TunePort",
  description: "Technical deep dive into TunePort's matching algorithm, sanitization logic, and download pipeline.",
};

export default function HowItWorksPage() {
  return (
    <div className="relative bg-white pb-24 pt-24 overflow-hidden">
      <RetroGrid className="light" />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <Link href="/docs">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-emerald-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Button>
          </Link>
        </div>

        <div className="relative mb-20 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 backdrop-blur-md mb-6">
            <Code2 className="h-4 w-4 mr-2" />
            Architecture Deep Dive
          </div>

          <TextAnimate animation="blurInUp" by="word" className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl mb-6">
            Under The Hood
          </TextAnimate>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            A transparent look at the algorithms and logic powering TunePort's metadata matching and download engine.
          </p>
        </div>

        <div className="mb-24">
          <MatchingFlowDiagram />
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">1</span>
            Sanitization Pipeline
          </h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="prose prose-slate">
              <p className="text-slate-600 text-lg mb-4">
                Raw YouTube titles are noisy. Before any matching occurs, the title passes through a rigorous sanitization layer.
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>Removes media markers (Official Video, Lyrics, 4K)</span>
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>Normalizes featuring artists (ft. → feat.)</span>
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>Extracts "Artist - Title" structure</span>
                </li>
              </ul>
            </div>

            <ShineBorder shineColor={["#6366f1", "#8b5cf6"]} className="relative overflow-hidden rounded-xl bg-slate-950 p-6 text-slate-50 shadow-xl">
              <div className="font-mono text-sm space-y-4">
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Input</div>
                  <div className="text-red-300">"The Weeknd - Blinding Lights (Official Audio) [HD]"</div>
                </div>
                <div className="h-px bg-slate-800" />
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Sanitized Output</div>
                  <div className="text-emerald-300">"The Weeknd - Blinding Lights"</div>
                </div>
                <div className="h-px bg-slate-800" />
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Extracted Metadata</div>
                  <div className="text-indigo-300">
                    Artist: "The Weeknd"<br/>
                    Title: "Blinding Lights"
                  </div>
                </div>
              </div>
            </ShineBorder>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">2</span>
            The Matching Algorithm
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-3xl">
            We use a weighted scoring system based on <strong>Jaro-Winkler similarity</strong> to ensure we find the exact track on Spotify, avoiding covers and remixes.
          </p>

          <BentoGrid className="grid-rows-1 md:grid-rows-2 h-[500px]">
            <BentoCard
              name="Title Similarity"
              className="md:col-span-2"
              Icon={Type}
              description="50% Weight. Compares the sanitized YouTube title with Spotify track title using fuzzy matching to handle minor typos or differences."
              href="#"
              cta="Core Metric"
              background={<div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-50" />}
            />
            <BentoCard
              name="Artist Similarity"
              className="md:col-span-1"
              Icon={User}
              description="35% Weight. Critical for preventing false positives. Mismatched artists heavily penalize the score."
              href="#"
              cta="Safety Check"
              background={<div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />}
            />
            <BentoCard
              name="Duration Match"
              className="md:col-span-1"
              Icon={Timer}
              description="15% Weight. Ensures the audio length is within 30 seconds, filtering out extended mixes or radio edits."
              href="#"
              cta="Validation"
              background={<div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-50" />}
            />
          </BentoGrid>

          <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-900 mb-1">Confidence Threshold: 0.7</h3>
                <p className="text-rose-800">
                  A match is only auto-added if the weighted score is <strong>&ge; 0.7</strong>. This strict threshold ensures that if the artist doesn't match, the song won't be added, solving the "AnimeOST vs Original Artist" problem.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
            Download Engine
          </h2>
          
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <BorderBeam size={250} duration={12} delay={9} borderWidth={1.5} colorFrom="#10B981" colorTo="#3B82F6" />
            
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">High-Fidelity Archival</h3>
                <p className="text-slate-600 mb-6">
                  TunePort doesn't just download the stream; it reconstructs a proper music file. We use <code>yt-dlp</code> with specific arguments to embed metadata that YouTube hides.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <FileAudio className="h-4 w-4 text-indigo-500" />
                    <span>Best Audio (Opus/AAC)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span>ID3 Tags (Artist, Title, Album)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Settings className="h-4 w-4 text-amber-500" />
                    <span>Embedded Thumbnail Art</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
                <div className="flex gap-2 mb-2 border-b border-slate-800 pb-2">
                  <span className="text-red-400">●</span>
                  <span className="text-yellow-400">●</span>
                  <span className="text-green-400">●</span>
                </div>
                <span className="text-emerald-400">$</span> yt-dlp \<br/>
                &nbsp;&nbsp;<span className="text-indigo-400">--extract-audio</span> \<br/>
                &nbsp;&nbsp;<span className="text-indigo-400">--audio-format</span> best \<br/>
                &nbsp;&nbsp;<span className="text-amber-400">--add-metadata</span> \<br/>
                &nbsp;&nbsp;<span className="text-amber-400">--embed-thumbnail</span> \<br/>
                &nbsp;&nbsp;<span className="text-slate-400">--parse-metadata "title:%(title)s"</span> \<br/>
                &nbsp;&nbsp;<span className="text-slate-400">--output "Artist - Title.ext"</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
