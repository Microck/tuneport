import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileAudio, Music2, AlertTriangle, Download, Github, BookOpen, Code2, GitBranch, ShieldCheck, Timer, Type, User, AlertCircle, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { MatchingFlowDiagram } from "@/components/diagrams/matching-flow";
import { Meteors } from "@/components/ui/meteors";
import WordRotate from "@/components/ui/word-rotate";
import RetroGrid from "@/components/ui/retro-grid";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "TunePort Docs",
  description: "Technical documentation on YouTube audio streams, transcoding, and matching algorithms.",
  openGraph: {
    title: "TunePort Docs",
    description: "Technical documentation on YouTube audio streams, transcoding, and matching algorithms.",
    url: "https://tuneflow.micr.dev/docs",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "TunePort Docs",
    description: "Technical documentation on YouTube audio streams, transcoding, and matching algorithms.",
  },
};

export default function DocsPage() {
  return (
    <div className="relative bg-white pb-24 pt-24 overflow-hidden">
      <RetroGrid className="light" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-rose-600" data-animate="button">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="relative mb-20 text-center">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 backdrop-blur-md mb-6" data-animate="text" data-animate-variant="slide-down">
            Docs
          </div>

          <div className="h-20 sm:h-24 flex items-center justify-center mb-6">
            <WordRotate
              className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl md:text-6xl"
              words={["Technical Architecture", "System Internals", "Deep Dive", "Audio Engineering"]}
            />
          </div>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed" data-animate="text" data-animate-variant="fade">
            Deep dive into YouTube's audio infrastructure, generation loss, and TunePort's internal matching logic.
          </p>
        </div>

        {/* --- Part 1: Audio Quality & Transcoding --- */}
        
        <div className="relative mb-16 rounded-2xl bg-white p-1 backdrop-blur-sm overflow-hidden border border-slate-200 shadow-sm">
          <div className="relative z-10 rounded-xl bg-white/80 p-8">
            <h3 className="mb-4 text-lg font-semibold text-emerald-600" data-animate="text" data-animate-variant="slide-up">Abstract</h3>
            <p className="text-slate-600 leading-relaxed" data-animate="text" data-animate-variant="fade">
              User-generated audio on video platforms has become a massive, unplanned music archive. Yet, serious misconceptions persist about the quality of these streams. Commercial converters profit from this confusion, selling &quot;320kbps MP3&quot; tools that cannot mathematically exist given the source material. This research evaluates YouTube&apos;s actual delivery infrastructure, demonstrating that the platform&apos;s standard Opus format provides superior spectral fidelity compared to legacy AAC-LC, and quantifies the degradation introduced by transcoding.
            </p>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-slate-900" data-animate="text" data-animate-variant="slide-left">
            <AnimatedShinyText className="text-slate-900">Key Findings</AnimatedShinyText>
          </h2>
          <BentoGrid className="lg:grid-rows-1">
            <BentoCard
              name="Opus is King"
              className="col-span-3 lg:col-span-1"
              background={<div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />}
              Icon={Music2}
              description="Itag 251 delivers 130–160kbps Opus with a full 20kHz bandwidth, transparent to the human ear."
              href="#architecture"
              cta="See Architecture"
            />
            <BentoCard
              name="AAC Caps at 16kHz"
              className="col-span-3 lg:col-span-1"
              background={<div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-50" />}
              Icon={FileAudio}
              description="Legacy AAC-LC streams apply a steep low-pass filter, discarding high-end detail."
              href="#comparison"
              cta="View Comparison"
            />
            <BentoCard
              name="Transcoding is Waste"
              className="col-span-3 lg:col-span-1"
              background={<div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-transparent opacity-50" />}
              Icon={AlertTriangle}
              description="Upscaling to 320kbps MP3 adds artifacts and inflates file size by ~250% with zero gain."
              href="#transcoding"
              cta="Learn Why"
            />
          </BentoGrid>
        </div>

        <div className="relative mb-20 overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm" id="transcoding">
          <BorderBeam size={250} duration={12} delay={9} borderWidth={1.5} colorFrom="#E11D48" colorTo="#10B981" />

          <div className="relative z-10">
            <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900" data-animate="text" data-animate-variant="slide-right">The &quot;320kbps&quot; Myth</h2>
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
              <div className="space-y-4">
                <p className="text-slate-600 leading-relaxed" data-animate="text" data-animate-variant="fade">
                  A persistent myth exists among end-users: that &quot;320kbps MP3&quot; represents the gold standard for ripped audio. Commercial &quot;YouTube to MP3&quot; converters exploit this misconception by performing deceptive upsampling.
                </p>
                <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-800 border border-rose-100" data-animate="text" data-animate-variant="fade">
                  <strong>Reality Check:</strong> Re-encoding a compressed source (Opus) to another lossy format (MP3) introduces generation loss. The result is strictly worse than the source.
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Format</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Codec</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Bitrate</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">251</td>
                      <td className="px-5 py-4"><span className="font-semibold text-slate-900">Opus</span></td>
                      <td className="px-5 py-4 text-slate-600">~160 kbps</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Best</span></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">140</td>
                      <td className="px-5 py-4"><span className="text-slate-600">AAC-LC</span></td>
                      <td className="px-5 py-4 text-slate-600">128 kbps</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Legacy</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- Part 2: TunePort Internals --- */}

        <div className="my-32 border-t border-slate-200" />

        <div className="relative mb-20 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 backdrop-blur-md mb-6">
            <Code2 className="h-4 w-4 mr-2" />
            Under The Hood
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
            How TunePort Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            A transparent look at the algorithms powering our metadata matching and download engine.
          </p>
        </div>

        <div className="mb-24">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">1</span>
            The Pipeline
          </h3>
          <div className="my-12">
            <MatchingFlowDiagram />
          </div>
        </div>

        <div className="mb-24">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">2</span>
            Sanitization Logic
          </h3>
          
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="prose prose-slate">
              <p className="text-slate-600 mb-4">
                Raw YouTube titles are noisy. We strip media markers (Official Video, Lyrics, 4K), normalize featuring artists, and extract "Artist - Title" structures before any matching occurs.
              </p>
            </div>

            <ShineBorder shineColor={["#6366f1", "#8b5cf6"]} className="relative overflow-hidden rounded-xl bg-white p-6 text-slate-900 shadow-sm border border-slate-200">
              <div className="font-mono text-sm space-y-4">
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Input</div>
                  <div className="text-red-600 bg-red-50 p-2 rounded border border-red-100">"The Weeknd - Blinding Lights (Official Audio) [HD]"</div>
                </div>
                <div className="h-px bg-slate-100" />
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider">Sanitized</div>
                  <div className="text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">"The Weeknd - Blinding Lights"</div>
                </div>
              </div>
            </ShineBorder>
          </div>
        </div>

        <div className="mb-24">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
            Matching Algorithm
          </h3>
          <p className="text-slate-600 mb-8 max-w-3xl">
            We use a weighted scoring system based on <strong>Jaro-Winkler similarity</strong> to prevent adding covers or remixes. Matches must score <strong>&ge; 0.7</strong> to be auto-added.
          </p>

          <BentoGrid className="grid-rows-1 md:grid-rows-2 h-[400px]">
            <BentoCard
              name="Title Similarity"
              className="md:col-span-2"
              Icon={Type}
              description="50% Weight. Fuzzy matching handles minor typos."
              href="#"
              cta="Core Metric"
              background={<div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-50" />}
            />
            <BentoCard
              name="Artist Similarity"
              className="md:col-span-1"
              Icon={User}
              description="35% Weight. Mismatches heavily penalize score."
              href="#"
              cta="Safety Check"
              background={<div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />}
            />
            <BentoCard
              name="Duration Match"
              className="md:col-span-1"
              Icon={Timer}
              description="15% Weight. Filters out extended mixes."
              href="#"
              cta="Validation"
              background={<div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-50" />}
            />
          </BentoGrid>
        </div>

        <div className="mb-24">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">4</span>
            Download Engine
          </h3>
          
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">High-Fidelity Archival</h4>
                <p className="text-slate-600 mb-4 text-sm">
                  We use <code>yt-dlp</code> with specific arguments to embed metadata that YouTube hides.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <FileAudio className="h-4 w-4 text-indigo-500" />
                    <span>Best Audio (Opus/AAC)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <User className="h-4 w-4 text-emerald-500" />
                    <span>ID3 Tags (Artist, Title)</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-600 leading-relaxed shadow-sm">
                <div className="flex gap-2 mb-2 border-b border-slate-200 pb-2">
                  <span className="text-red-400">●</span>
                  <span className="text-yellow-400">●</span>
                  <span className="text-green-400">●</span>
                </div>
                <span className="text-emerald-600">$</span> yt-dlp \<br/>
                &nbsp;&nbsp;<span className="text-indigo-600">--extract-audio</span> \<br/>
                &nbsp;&nbsp;<span className="text-indigo-600">--audio-format</span> best \<br/>
                &nbsp;&nbsp;<span className="text-amber-600">--add-metadata</span> \<br/>
                &nbsp;&nbsp;<span className="text-amber-600">--embed-thumbnail</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="https://github.com/Microck/tuneport/blob/main/docs/archival_and_transcoding.pdf" target="_blank">
            <Button size="lg" className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800" data-animate="button">
              <Download className="h-4 w-4" />
              Download Full PDF
            </Button>
          </Link>
          <Link href="/tutorial">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" data-animate="button">
              <BookOpen className="h-4 w-4" />
              Read Tutorial
            </Button>
          </Link>
          <Link href="https://github.com/Microck/tuneport" target="_blank">
            <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2" data-animate="button">
              <Github className="h-4 w-4" />
              View Source
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
