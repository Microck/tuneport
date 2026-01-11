import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Generation Loss Research | TunePort",
  description: "Why transcoding destroys audio fidelity: A technical analysis of YouTube's delivery infrastructure.",
};

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-rose-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <article className="prose prose-slate lg:prose-lg mx-auto bg-white p-8 md:p-12 shadow-sm rounded-2xl border border-slate-100">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Generation Loss in Digital Archival: Why Transcoding Destroys Fidelity
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 border-b border-slate-100 pb-8">
            <p>By 5 aka M. J.</p>
            <span>•</span>
            <p>Independent Researcher</p>
            <span>•</span>
            <time>Jan 11, 2026</time>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-lg p-6 mb-8">
            <h3 className="text-rose-900 font-semibold mt-0 mb-2">Abstract</h3>
            <p className="text-rose-800/80 m-0 text-base leading-relaxed">
              User-generated audio on video platforms has become a massive, unplanned music archive. Yet, serious misconceptions persist about the quality of these streams. Commercial converters profit from this confusion, selling "320kbps MP3" tools that cannot mathematically exist given the source material. This research evaluates YouTube's actual delivery infrastructure, demonstrating that the platform's standard Opus format provides superior spectral fidelity compared to legacy AAC-LC, and quantifies the degradation introduced by transcoding.
            </p>
          </div>

          <h2>The "320kbps" Myth</h2>
          <p>
            A persistent myth exists among end-users: that "320kbps MP3" represents the gold standard for ripped audio. Commercial "YouTube to MP3" converters exploit this misconception by performing deceptive upsampling. These services decode the ~128kbps source stream and re-encode it at 320kbps, padding the file with null data without restoring missing frequencies.
          </p>

          <h2>Audio Architecture</h2>
          <p>
            YouTube decouples audio and video into separate DASH streams. While the platform accepts lossless uploads (FLAC/PCM), the client is always served a compressed stream.
          </p>

          <div className="overflow-x-auto my-8">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 font-semibold text-slate-900">
                <tr>
                  <th className="px-4 py-3">Format (Itag)</th>
                  <th className="px-4 py-3">Codec</th>
                  <th className="px-4 py-3">Bitrate</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-mono text-slate-500">251</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">Opus</td>
                  <td className="px-4 py-3">130-160k</td>
                  <td className="px-4 py-3 text-emerald-700">Standard Best (Transparent)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-slate-500">140</td>
                  <td className="px-4 py-3">AAC-LC</td>
                  <td className="px-4 py-3">128k</td>
                  <td className="px-4 py-3 text-slate-500">Legacy Default (16kHz Cutoff)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-slate-500">141</td>
                  <td className="px-4 py-3">AAC-LC</td>
                  <td className="px-4 py-3">256k</td>
                  <td className="px-4 py-3 text-amber-600">Premium Only</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>The Opus Advantage</h3>
          <p>
            For the vast majority of users, <strong>Opus (Itag 251)</strong> is the highest quality option. It utilizes spectral folding to reconstruct high-frequency content, allowing it to maintain a 20kHz bandwidth even at lower bitrates. In contrast, YouTube's legacy AAC-LC implementation applies a steep low-pass filter at approximately 16kHz, discarding nearly 4kHz of audible high-frequency content.
          </p>

          <h2>The Fallacy of Transcoding</h2>
          <p>
            Re-encoding a compressed source (Opus) to another lossy format (MP3) introduces <em>generation loss</em>. The MP3 encoder attempts to model quantization artifacts from the Opus stream as actual data, adding its own layer of artifacts on top.
          </p>
          
          <ul className="list-disc pl-6 space-y-2 marker:text-rose-500">
            <li><strong>Fidelity Loss:</strong> The result is strictly worse than the source.</li>
            <li><strong>Storage Inefficiency:</strong> Transcoding 130kbps Opus to 320kbps MP3 increases file size by approximately <strong>250%</strong> with zero information gain.</li>
          </ul>

          <h2>Validation Methodology</h2>
          <p>
            To distinguish between true high-fidelity audio and upscaled transcoding, spectral analysis is required.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>True 320kbps MP3:</strong> Shows energy content reaching up to 20kHz or 22kHz.</li>
            <li><strong>Upscaled Transcode:</strong> Exhibits a "hard shelf" cut-off at 16kHz (if sourced from AAC) despite the file header reporting 320kbps.</li>
          </ul>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mt-8">
            <h3 className="text-lg font-bold text-slate-900 mt-0">Conclusion</h3>
            <p className="mb-0 text-slate-700">
              The belief that "320kbps" implies quality is a relic. TunePort prioritizes <strong>native extraction</strong> (Opus/.webm) to preserve the original stream integrity, avoiding the destructive generation loss found in common "converter" tools.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
