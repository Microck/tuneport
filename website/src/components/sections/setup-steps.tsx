"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Download, LayoutTemplate, Link as LinkIcon, Key, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SetupSteps() {
  const [copied, setCopied] = useState(false);
  const redirectUri = "https://<extension-id>.chromiumapp.org/";

  const handleCopy = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-8 mt-12 mb-20">
      <MagicCard 
        className="flex flex-col md:flex-row items-start gap-6 p-6 md:p-8"
        gradientColor="#10B981"
        gradientOpacity={0.1}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">01</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Install the Extension</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Download the latest release package, unzip it, and load it into Chrome via Developer Mode.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="https://github.com/Microck/tuneport/releases" target="_blank">
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20">
                <Download className="w-4 h-4" />
                Download Latest Release
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <code className="font-mono font-bold">chrome://extensions</code>
              <span>→ Enable "Developer mode" → Load unpacked</span>
            </div>
          </div>
        </div>
      </MagicCard>

      <MagicCard 
        className="flex flex-col md:flex-row items-start gap-6 p-6 md:p-8"
        gradientColor="#3B82F6"
        gradientOpacity={0.1}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <LayoutTemplate className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">02</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Spotify App</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Go to the Spotify Developer Dashboard to create a new application. This gives you your own personal API quota, ensuring you never hit rate limits.
          </p>
          <Link href="https://developer.spotify.com/dashboard" target="_blank">
            <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              <LayoutTemplate className="w-4 h-4" />
              Open Developer Dashboard
            </Button>
          </Link>
        </div>
      </MagicCard>

      <MagicCard 
        className="flex flex-col md:flex-row items-start gap-6 p-6 md:p-8"
        gradientColor="#E11D48"
        gradientOpacity={0.1}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <LinkIcon className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">03</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add Redirect URI</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            In your new Spotify App settings, add the Redirect URI. You can find your specific ID in the TunePort extension setup screen.
          </p>
          <div className="relative group">
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-lg blur opacity-50 transition-opacity group-hover:opacity-75" />
            <div className="relative flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-sm text-slate-600 dark:text-slate-300">
              <span className="truncate">https://&lt;extension-id&gt;.chromiumapp.org/</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </MagicCard>

      <MagicCard 
        className="flex flex-col md:flex-row items-start gap-6 p-6 md:p-8"
        gradientColor="#8B5CF6"
        gradientOpacity={0.1}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
          <Key className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">04</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enter Client ID</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Copy the <strong>Client ID</strong> from your Spotify Dashboard and paste it into the TunePort extension setup screen.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Setup Complete
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
