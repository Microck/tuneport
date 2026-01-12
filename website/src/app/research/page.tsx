import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileAudio, Music2, AlertTriangle, Download, Github, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Generation Loss Research",
  description: "Why transcoding destroys audio fidelity: a technical analysis of YouTube's delivery infrastructure.",
  openGraph: {
    title: "Generation Loss Research",
    description: "Why transcoding destroys audio fidelity: a technical analysis of YouTube's delivery infrastructure.",
    url: "https://tuneflow.micr.dev/research",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Generation Loss Research",
    description: "Why transcoding destroys audio fidelity: a technical analysis of YouTube's delivery infrastructure.",
  },
};

export default function ResearchPage() {
  return (
    <div className="relative min-h-screen bg-white pb-24 pt-24">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-rose-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="relative mb-16 text-center">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800 backdrop-blur-md mb-6">
                Technical Analysis
            </div>
            
          <TextAnimate animation="blurInUp" by="word" className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl md:text-6xl mb-6">
            Generation Loss in Digital Archival
          </TextAnimate>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
             Why transcoding destroys audio fidelity: a technical deep dive into YouTube&apos;s audio infrastructure and the &quot;320kbps&quot; myth.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-slate-500">
            <p>By 5 aka M. J.</p>
            <span>•</span>
            <p>Independent Researcher</p>
            <span>•</span>
            <time>Jan 11, 2026</time>
          </div>
        </div>

        <div className="relative mb-16 rounded-2xl bg-white/50 p-1 backdrop-blur-sm">
            <ShineBorder shineColor={["#E11D48", "#10B981"]} className="rounded-2xl" borderWidth={1.5}>
                <div className="rounded-xl bg-white/80 p-8 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Abstract</h3>
                    <p className="text-slate-600 leading-relaxed">
                    User-generated audio on video platforms has become a massive, unplanned music archive. Yet, serious misconceptions persist about the quality of these streams. Commercial converters profit from this confusion, selling &quot;320kbps MP3&quot; tools that cannot mathematically exist given the source material. This research evaluates YouTube&apos;s actual delivery infrastructure, demonstrating that the platform&apos;s standard Opus format provides superior spectral fidelity compared to legacy AAC-LC, and quantifies the degradation introduced by transcoding.
                    </p>
                </div>
            </ShineBorder>
        </div>

        <div className="mb-20">
            <h2 className="mb-8 text-2xl font-bold tracking-tight text-slate-900">Key Findings</h2>
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
                <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">The &quot;320kbps&quot; Myth</h2>
                <div className="grid gap-12 lg:grid-cols-2">
                    <div className="space-y-4">
                        <p className="text-slate-600 leading-relaxed">
                            A persistent myth exists among end-users: that &quot;320kbps MP3&quot; represents the gold standard for ripped audio. Commercial &quot;YouTube to MP3&quot; converters exploit this misconception by performing deceptive upsampling.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                            These services decode the ~128kbps source stream and re-encode it at 320kbps, padding the file with null data without restoring missing frequencies.
                        </p>
                        <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-800 border border-rose-100">
                            <strong>Reality Check:</strong> Re-encoding a compressed source (Opus) to another lossy format (MP3) introduces generation loss. The result is strictly worse than the source.
                        </div>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/50 shadow-sm backdrop-blur-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-900">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Format (Itag)</th>
                                    <th className="px-4 py-3 font-semibold">Codec</th>
                                    <th className="px-4 py-3 font-semibold">Bitrate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-emerald-50/50">
                                    <td className="px-4 py-3 font-mono text-slate-500">251</td>
                                    <td className="px-4 py-3 font-bold text-emerald-600">Opus</td>
                                    <td className="px-4 py-3">130-160k</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-mono text-slate-500">140</td>
                                    <td className="px-4 py-3">AAC-LC</td>
                                    <td className="px-4 py-3">128k</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-mono text-slate-500">141</td>
                                    <td className="px-4 py-3">AAC-LC</td>
                                    <td className="px-4 py-3">256k</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="bg-slate-50 p-3 text-xs text-slate-500 text-center border-t border-slate-100">
                            Table 1.1: YouTube Audio Stream Formats
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <article className="prose prose-slate lg:prose-lg max-w-none mb-16">
             <h2 className="text-2xl font-bold tracking-tight text-slate-900" id="architecture">Audio Architecture</h2>
             <p className="text-slate-600">
                YouTube decouples audio and video into separate DASH streams. While the platform accepts lossless uploads (FLAC/PCM), the client is always served a compressed stream. For the vast majority of users, <strong>Opus (Itag 251)</strong> is the highest quality option. It utilizes spectral folding to reconstruct high-frequency content, allowing it to maintain a 20kHz bandwidth even at lower bitrates.
             </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-12">Validation Methodology</h2>
            <p className="text-slate-600">
            To distinguish between true high-fidelity audio and upscaled transcoding, spectral analysis is required.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 list-none pl-0 mt-6">
                <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <strong className="block text-slate-900 mb-2">True 320kbps MP3</strong>
                    <span className="text-slate-600">Shows energy content reaching up to 20kHz or 22kHz consistently across the spectrum.</span>
                </li>
                <li className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <strong className="block text-slate-900 mb-2">Upscaled Transcode</strong>
                    <span className="text-slate-600">Exhibits a &quot;hard shelf&quot; cut-off at 16kHz (if sourced from AAC) despite the file header reporting 320kbps.</span>
                </li>
            </ul>
        </article>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="https://github.com/Microck/tuneport/blob/main/docs/archival_and_transcoding.pdf" target="_blank">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-slate-900 text-white hover:bg-slate-800">
                  <Download className="h-4 w-4" />
                  Download Full PDF
              </Button>
            </Link>
            <Link href="/tutorial">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <BookOpen className="h-4 w-4" />
                  Read Tutorial
              </Button>
            </Link>
            <Link href="https://github.com/Microck/tuneport" target="_blank">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                  <Github className="h-4 w-4" />
                  View Source
              </Button>
            </Link>
        </div>
        
      </div>
    </div>
  );
}
