import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileAudio, Music2, AlertTriangle, Download, Github, BookOpen, Code2, GitBranch, ShieldCheck, Timer, Type, User, AlertCircle, Settings, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { MatchingFlowDiagram } from "@/components/diagrams/matching-flow";
import { MatchingWeightsChart } from "@/components/diagrams/matching-weights";
import WordRotate from "@/components/ui/word-rotate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="absolute inset-0 h-[800px] overflow-hidden">
        <DotPattern 
          width={32}
          height={32}
          className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)] opacity-40")} 
        />
      </div>

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

        <div className="relative mb-16">
          <MagicCard className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" gradientColor={"#F1F5F9"}>
            <h3 className="mb-4 text-lg font-semibold text-emerald-600">Abstract</h3>
            <p className="text-slate-600 leading-relaxed">
              User-generated audio on video platforms has become a massive, unplanned music archive. Yet, serious misconceptions persist about the quality of these streams. Commercial converters profit from this confusion, selling &quot;320kbps MP3&quot; tools that cannot mathematically exist given the source material. This research evaluates YouTube&apos;s actual delivery infrastructure, demonstrating that the platform&apos;s standard Opus format provides superior spectral fidelity compared to legacy AAC-LC, and quantifies the degradation introduced by transcoding.
            </p>
          </MagicCard>
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

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[100px]">Format</TableHead>
                      <TableHead>Codec</TableHead>
                      <TableHead>Bitrate</TableHead>
                      <TableHead className="text-right">Quality</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">251</TableCell>
                      <TableCell>Opus (.webm)</TableCell>
                      <TableCell>130–160 kbps</TableCell>
                      <TableCell className="text-right"><span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Best</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">140</TableCell>
                      <TableCell>AAC (.m4a)</TableCell>
                      <TableCell>128 kbps</TableCell>
                      <TableCell className="text-right"><span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">Legacy</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">141</TableCell>
                      <TableCell>AAC (.m4a)</TableCell>
                      <TableCell>256 kbps</TableCell>
                      <TableCell className="text-right"><span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">Premium</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">380</TableCell>
                      <TableCell>EC-3 (.m4a)</TableCell>
                      <TableCell>384 kbps</TableCell>
                      <TableCell className="text-right"><span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">5.1</span></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">250</TableCell>
                      <TableCell>Opus (.webm)</TableCell>
                      <TableCell>60-80 kbps</TableCell>
                      <TableCell className="text-right"><span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Mobile</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <div className="my-32 border-t border-slate-200" />

        <div className="mb-24">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-12 text-center">
            How It Works
          </h2>
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

            <MagicCard className="relative overflow-hidden rounded-xl border border-slate-200 p-6 shadow-sm bg-white" gradientColor={"#F1F5F9"}>
              <div className="font-sans text-sm space-y-4">
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Input</div>
                  <div className="font-sans text-base font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">"The Weeknd - Blinding Lights (Official Audio) [HD]"</div>
                </div>
                <div className="h-px bg-slate-100" />
                <div>
                  <div className="text-slate-500 mb-1 text-xs uppercase tracking-wider font-semibold">Sanitized</div>
                  <div className="font-sans text-base font-medium text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">"The Weeknd - Blinding Lights"</div>
                </div>
              </div>
            </MagicCard>
          </div>
        </div>

        <div className="mb-24">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
            Matching Algorithm
          </h3>
          <p className="text-slate-600 mb-8 max-w-3xl">
            We use a smart, weighted scoring system to prevent adding covers or remixes. Matches must score <strong>&ge; 0.7</strong> to be auto-added. (For the technically curious, we utilize Jaro-Winkler similarity for text comparison).
          </p>

          <div className="space-y-12">
            <MatchingWeightsChart />

            <div className="flex flex-col md:flex-row gap-4">
              <MagicCard className="flex-[5] p-6 border border-slate-200 bg-white" gradientColor="#F1F5F9">
                <div className="flex items-center gap-3 mb-3 text-indigo-600">
                  <Type className="h-6 w-6" />
                  <h4 className="font-bold">Title Similarity</h4>
                </div>
                <p className="text-sm text-slate-600">50% Weight. Fuzzy matching handles minor typos and formatting differences.</p>
              </MagicCard>
              <MagicCard className="flex-[3.5] p-6 border border-slate-200 bg-white" gradientColor="#F1F5F9">
                <div className="flex items-center gap-3 mb-3 text-emerald-600">
                  <User className="h-6 w-6" />
                  <h4 className="font-bold">Artist Similarity</h4>
                </div>
                <p className="text-sm text-slate-600">35% Weight. Ensures it's the original performer, not a cover band.</p>
              </MagicCard>
              <MagicCard className="flex-[1.5] p-6 border border-slate-200 bg-white" gradientColor="#F1F5F9">
                <div className="flex items-center gap-3 mb-3 text-amber-600">
                  <Timer className="h-6 w-6" />
                  <h4 className="font-bold">Duration</h4>
                </div>
                <p className="text-sm text-slate-600">15% Weight. Filters extended mixes.</p>
              </MagicCard>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
                <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Example: The Good Match
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-emerald-100 pb-2">
                    <span className="text-slate-500">Input</span>
                    <span className="font-medium text-slate-900">Michael Jackson - Billie Jean</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 pb-2">
                    <span className="text-slate-500">Match</span>
                    <span className="font-medium text-slate-900">Billie Jean (Remastered 2015)</span>
                  </div>
                  <div className="pt-2 font-mono text-xs">
                    <div className="flex justify-between text-emerald-700"><span>Title Score</span><span>0.95 (Fuzzy)</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Artist Score</span><span>1.00 (Exact)</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Duration</span><span>0.98</span></div>
                    <div className="flex justify-between font-bold text-emerald-900 mt-2 border-t border-emerald-200 pt-2"><span>FINAL SCORE</span><span>0.97 (Pass)</span></div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6">
                <h4 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                  Example: The Cover Song
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-rose-100 pb-2">
                    <span className="text-slate-500">Input</span>
                    <span className="font-medium text-slate-900">The Beatles - Yesterday</span>
                  </div>
                  <div className="flex justify-between border-b border-rose-100 pb-2">
                    <span className="text-slate-500">Match</span>
                    <span className="font-medium text-slate-900">Boyz II Men - Yesterday</span>
                  </div>
                  <div className="pt-2 font-mono text-xs">
                    <div className="flex justify-between text-emerald-700"><span>Title Score</span><span>1.00 (Exact)</span></div>
                    <div className="flex justify-between text-rose-600 font-bold"><span>Artist Score</span><span>0.10 (Mismatch)</span></div>
                    <div className="flex justify-between text-emerald-700"><span>Duration</span><span>0.90</span></div>
                    <div className="flex justify-between font-bold text-rose-900 mt-2 border-t border-rose-200 pt-2"><span>FINAL SCORE</span><span>0.58 (Fail)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              
              <MagicCard className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white" gradientColor="#F1F5F9">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  <div className="ml-2 text-[10px] font-medium text-slate-400 font-sans">bash</div>
                </div>
                <div className="p-5 font-mono text-xs leading-relaxed text-slate-600">
                  <span className="select-none text-emerald-600 mr-2">$</span>
                  yt-dlp \<br/>
                  <div className="pl-4 space-y-1 mt-1">
                    <div><span className="text-indigo-600">--extract-audio</span> \</div>
                    <div><span className="text-indigo-600">--audio-format</span> best \</div>
                    <div><span className="text-amber-600">--add-metadata</span> \</div>
                    <div><span className="text-amber-600">--embed-thumbnail</span></div>
                  </div>
                </div>
              </MagicCard>
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
