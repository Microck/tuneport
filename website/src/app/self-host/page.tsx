import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Server, Shield, Terminal, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { TextAnimate } from "@/components/ui/text-animate";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Self-Host Guide | TunePort",
  description: "Learn how to self-host the yt-dlp service for TunePort.",
};

export default function SelfHostPage() {
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
          <Link href="/">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-600 hover:bg-transparent hover:text-emerald-600">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="relative mb-16 text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 backdrop-blur-md mb-6">
            <Server className="h-4 w-4 mr-2" />
            Self-Host Guide
          </div>

          <TextAnimate animation="blurInUp" by="word" className="text-4xl font-bold tracking-tighter text-slate-900 sm:text-5xl mb-6">
            Run Your Own Infrastructure
          </TextAnimate>

          <p className="mx-auto max-w-2xl text-lg text-slate-600 leading-relaxed">
            Take full control of your downloads by hosting the TunePort yt-dlp service on your own machine or VPS.
          </p>
        </div>

        <div className="prose prose-slate lg:prose-lg max-w-none">
          <div className="grid gap-8 md:grid-cols-2 mb-12 not-prose">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Shield className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Privacy & Control</h3>
              <p className="text-slate-600 text-sm">
                No reliance on public instances. All traffic stays between you and YouTube. You control the logs and data retention.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Terminal className="h-8 w-8 text-indigo-500 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Performance</h3>
              <p className="text-slate-600 text-sm">
                Dedicated resources mean faster processing and downloads. No rate limits from shared public APIs.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-16 mb-8">Part 1: yt-dlp Service (Docker)</h2>
          <p className="mb-8 text-slate-600">
            To enable downloads, you need a backend service. While we provide a public instance, self-hosting ensures better performance and privacy.
          </p>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">1</span>
            Prerequisites
          </h3>
          <ul className="list-disc pl-6 mb-8 text-slate-600">
            <li><strong>Docker</strong> & <strong>Docker Compose</strong> installed on your server or local machine.</li>
            <li>Basic knowledge of command line interface.</li>
            <li>(Optional) A domain name with HTTPS (recommended for secure access).</li>
          </ul>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">2</span>
            Quick Start
          </h3>
          <p className="mb-4">Clone the repository and navigate to the service directory:</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <code>{`git clone https://github.com/Microck/tuneport.git
cd tuneport/yt-dlp-service`}</code>
          </pre>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
            Configure Authentication
          </h3>
          <p className="mb-4">
            Edit the <code>docker-compose.yml</code> file to set your secure token. You will need this token later in the extension settings.
          </p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <code>{`version: '3.8'
services:
  yt-dlp:
    build: .
    ports:
      - "3001:5000"
    volumes:
      - ./data:/data
      - ./config:/config
    environment:
      - YTDLP_TOKEN=change-me-to-a-secure-random-token`}</code>
          </pre>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">4</span>
            Run the Service
          </h3>
          <p className="mb-4">Start the container in detached mode:</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <code>{`docker-compose up -d --build`}</code>
          </pre>
          <p className="mb-4">Verify it&apos;s running:</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <code>{`curl http://localhost:3001/health
# Output: {"status": "ok"}`}</code>
          </pre>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">5</span>
            Connect Extension
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-12">
            <ol className="list-decimal pl-5 space-y-3 text-slate-700">
              <li>Open <strong>TunePort Settings</strong> in your browser extension.</li>
              <li>Under "Download Provider", ensure <strong>yt-dlp</strong> is selected.</li>
              <li>In "Instance URL", enter your server URL (e.g., <code>http://localhost:3001</code> or your HTTPS domain).</li>
              <li>In "API Token", enter the <code>YTDLP_TOKEN</code> you configured in step 3.</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-16">
            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5" />
              Advanced: Bypassing Bot Detection
            </h3>
            <p className="text-amber-800 text-sm mb-4">
              If you encounter "Sign in to confirm you're not a bot" errors, you need to provide cookies.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-amber-800 text-sm">
              <li>Export your YouTube cookies to a <code>cookies.txt</code> file (using an extension like "Get cookies.txt LOCALLY").</li>
              <li>Place the file in <code>yt-dlp-service/config/cookies.txt</code> on your server.</li>
              <li>Restart the container: <code>docker-compose restart</code>.</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-16 mb-8">Part 2: Relay Bridge (Local Files)</h2>
          <p className="mb-4 text-slate-600">
            The Relay Bridge allows the Chrome extension to communicate with your local Spotify desktop client via Spicetify. This enables &quot;Local Files&quot; syncing.
          </p>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">1</span>
            Install Spicetify
          </h3>
          <p className="mb-4 text-slate-600">Spicetify is a CLI tool that patches the Spotify desktop client. Install it first:</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-4">
            <code>{`# Windows (PowerShell)
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex

# macOS/Linux (Bash)
curl -fsSL https://raw.githubusercontent.com/spicetify/cli/main/install.sh | sh`}</code>
          </pre>
          <p className="mb-8 text-slate-600">Run <code>spicetify backup apply</code> after installation to patch Spotify.</p>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">2</span>
            Install TunePort Bridge Extension
          </h3>
          <p className="mb-4 text-slate-600">Two options:</p>
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-slate-900 mb-2">Option A: Marketplace</h4>
              <p className="text-sm text-slate-600">Open Spicetify Marketplace in Spotify and search for &quot;TunePort Bridge&quot;.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-slate-900 mb-2">Option B: Manual</h4>
              <pre className="text-xs bg-slate-900 text-slate-50 p-2 rounded overflow-x-auto font-mono">
                <code>{`# Copy tuneport.js to extensions
spicetify config extensions tuneport.js
spicetify apply`}</code>
              </pre>
            </div>
          </div>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">3</span>
            Run the Relay Server
          </h3>
          <p className="mb-4 text-slate-600">The relay server bridges the Chrome extension and Spotify. We host a public instance at <code>wss://relay.micr.dev</code>, or self-host:</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-4">
            <code>{`cd tuneport/relay-server
npm install
npm start`}</code>
          </pre>
          <p className="mb-4 text-slate-600">The server listens on port 8080 by default. Set <code>PORT</code> env var to change it.</p>
          <pre className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-8">
            <code>{`# Verify it's running
curl http://localhost:8080/health
# Output: {"status": "ok"}`}</code>
          </pre>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">4</span>
            Generate and Sync Token
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <ol className="list-decimal pl-5 space-y-3 text-slate-700">
              <li>Open <strong>TunePort Extension Settings</strong> → <strong>Bridge Mode</strong>.</li>
              <li>Click <strong>&quot;Generate Token&quot;</strong>. A random 32-character hex token is created.</li>
              <li>Copy this token.</li>
              <li>In <strong>Spotify Desktop</strong>, click your profile menu → <strong>&quot;TunePort Bridge Token&quot;</strong>.</li>
              <li>Paste the token and reload Spotify.</li>
            </ol>
          </div>

          <h3 className="flex items-center gap-2 font-bold text-lg text-slate-900 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">5</span>
            Enable Local Files in Spotify
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <ol className="list-decimal pl-5 space-y-3 text-slate-700">
              <li>Open Spotify Desktop → <strong>Settings</strong> → scroll to <strong>&quot;Local Files&quot;</strong>.</li>
              <li>Enable <strong>&quot;Show Local Files&quot;</strong>.</li>
              <li>Add <strong><code>Downloads/TunePort</code></strong> as a source folder (or wherever TunePort saves files).</li>
            </ol>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-12">
            <h3 className="text-lg font-bold text-emerald-900 mb-4">How It Works</h3>
            <p className="text-emerald-800 text-sm mb-4">
              When you download a track via TunePort:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-emerald-800 text-sm">
              <li>File saves to <code>Downloads/TunePort</code> on your machine.</li>
              <li>Extension sends a WebSocket message to the relay with the filename and playlist ID.</li>
              <li>Spicetify extension receives the message, refreshes Local Files, and matches the filename.</li>
              <li>Track is added to your chosen Spotify playlist automatically.</li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5" />
              Troubleshooting
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-amber-800 text-sm">
              <li><strong>Bridge not connecting:</strong> Ensure both extension and Spicetify use the same token.</li>
              <li><strong>Track not found:</strong> Verify the file is in a folder Spotify monitors. Try restarting Spotify.</li>
              <li><strong>Self-hosted relay:</strong> Update <code>RELAY_BASE</code> in <code>tuneport.js</code> to your server URL.</li>
              <li><strong>Check relay status:</strong> <code>curl http://localhost:8080/status/YOUR_TOKEN</code> shows connected clients.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
