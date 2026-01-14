import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Code2, GitBranch, Database, ShieldCheck, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How It Works | TunePort",
  description: "Technical deep dive into TunePort's matching algorithm, sanitization logic, and download pipeline.",
};

export default function HowItWorksPage() {
  return (
    <div className="relative bg-white pb-24 pt-24 overflow-hidden">
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

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link href="/docs">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-emerald-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Button>
          </Link>
        </div>

        <div className="relative mb-16 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 backdrop-blur-md mb-6">
            <Code2 className="h-4 w-4 mr-2" />
            System Internals
          </div>

          <TextAnimate animation="blurInUp" by="word" className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl mb-6">
            How TunePort Works
          </TextAnimate>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            A transparent look at the algorithms and logic powering TunePort's metadata matching and download engine.
          </p>
        </div>

        <div className="prose prose-slate lg:prose-lg max-w-none">
          
          <div className="grid gap-8 md:grid-cols-2 mb-12 not-prose">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sanitization</h3>
              <p className="text-slate-600 text-sm">
                Aggressive regex patterns clean up "YouTube noise" (e.g., "(Official Video)", "[4K]", "Lyrics") to reveal the true track title.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <GitBranch className="h-8 w-8 text-indigo-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Fuzzy Matching</h3>
              <p className="text-slate-600 text-sm">
                Jaro-Winkler similarity scoring with weighted factors ensures we find the exact song on Spotify, not a karaoke cover.
              </p>
            </div>
          </div>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mt-12 mb-6">
            1. Metadata Extraction & Sanitization
          </h2>
          <p className="text-slate-600 mb-4">
            Before searching Spotify, we must clean the YouTube title. Raw titles often contain "noise" that confuses search engines.
          </p>
          <div className="bg-slate-900 rounded-xl p-4 mb-6 overflow-x-auto">
            <code className="text-sm font-mono text-emerald-400">
              // Input: "The Weeknd - Blinding Lights (Official Audio) [HD]"<br/>
              // Output: "The Weeknd - Blinding Lights"
            </code>
          </div>
          <p className="text-slate-600 mb-4">
            We use a comprehensive list of RegEx patterns to remove:
          </p>
          <ul className="list-disc pl-6 mb-8 text-slate-600 space-y-2">
            <li>Media types: <code>(Official Video)</code>, <code>(Audio)</code>, <code>(Visualizer)</code>, <code>(Lyric Video)</code></li>
            <li>Quality markers: <code>[HD]</code>, <code>[HQ]</code>, <code>[4K]</code>, <code>[1080p]</code></li>
            <li>Edits: <code>(Radio Edit)</code>, <code>(Clean Version)</code>, <code>(Remastered)</code></li>
            <li>Featuring: Normalizes <code>feat.</code>, <code>ft.</code>, <code>featuring</code>, <code>with</code>, <code>x</code> to a standard format.</li>
          </ul>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mt-12 mb-6">
            2. The Matching Algorithm
          </h2>
          <p className="text-slate-600 mb-4">
            Once we have a clean search query, we fetch results from Spotify. But getting results isn't enough—we need the <em>right</em> result. We score each candidate using a weighted algorithm:
          </p>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">Factor</th>
                  <th className="px-6 py-3 font-semibold">Weight</th>
                  <th className="px-6 py-3 font-semibold">Algorithm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-4">Title Similarity</td>
                  <td className="px-6 py-4 font-mono text-emerald-600">50%</td>
                  <td className="px-6 py-4 text-slate-600">Jaro-Winkler Distance</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Artist Similarity</td>
                  <td className="px-6 py-4 font-mono text-emerald-600">35%</td>
                  <td className="px-6 py-4 text-slate-600">Jaro-Winkler Distance</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Duration Match</td>
                  <td className="px-6 py-4 font-mono text-emerald-600">15%</td>
                  <td className="px-6 py-4 text-slate-600">Linear (&lt;30s delta)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <p className="text-amber-800 text-sm font-medium">
              <strong>Threshold Rule:</strong> A match is only auto-added if the total score is <strong>&ge; 0.7</strong>. This prevents false positives where the title matches perfectly (0.5) but the artist is completely wrong (0.0).
            </p>
          </div>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mt-12 mb-6">
            3. Download Pipeline
          </h2>
          <p className="text-slate-600 mb-4">
            We use <code>yt-dlp</code> with specific arguments to ensure high-fidelity archival and metadata embedding.
          </p>
          <div className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <pre><code>{`yt-dlp
  --no-playlist
  --extract-audio
  --audio-format best        # Opus (webm) or AAC (m4a)
  --add-metadata             # Embeds Artist, Title, Album
  --embed-thumbnail          # Embeds Video Thumbnail as Cover Art
  --parse-metadata "title:%(title)s"
  --output "Artist - Title.ext"`}</code></pre>
          </div>

          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mt-12 mb-6">
            4. Smart Sync Logic
          </h2>
          <p className="text-slate-600 mb-4">
            The extension handles edge cases gracefully:
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-1 min-w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">A</div>
              <div>
                <strong className="text-slate-900">Found on Spotify:</strong> Added to your playlist. Download is optional (based on settings).
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 min-w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">B</div>
              <div>
                <strong className="text-slate-900">Not found on Spotify:</strong> If "Enable Download" is ON, we download the file anyway. The system notifies you to add the download folder to <strong>Spotify Local Files</strong>.
              </div>
            </li>
          </ul>

        </div>
      </div>
    </div>
  );
}
