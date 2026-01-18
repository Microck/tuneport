import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Eye, Database, Lock, Server, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy - TunePort",
  description: "TunePort privacy policy. We don't collect your data.",
  openGraph: {
    title: "Privacy Policy - TunePort",
    description: "TunePort privacy policy. We don't collect your data.",
    url: "https://tuneport.micr.dev/privacy",
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <div className="relative bg-white pb-24 pt-24 overflow-hidden">
      <div className="absolute inset-0 h-[600px] overflow-hidden">
        <DotPattern 
          width={32}
          height={32}
          className={cn("[mask-image:radial-gradient(500px_circle_at_center,white,transparent)] opacity-40")} 
        />
      </div>
      
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2">
            <ArrowLeft className="h-4 w-4" />
            back
          </Button>
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">
          privacy policy
        </h1>
        <p className="text-zinc-500 mb-12">last updated: january 2025</p>

        <div className="space-y-12">
          <Section icon={Shield} title="the short version">
            <p>
              tuneport does not collect, store, or transmit any personal data. 
              everything runs locally in your browser. we have no servers, no analytics, 
              no tracking. your data stays on your device.
            </p>
          </Section>

          <Section icon={Database} title="data we don't collect">
            <ul className="list-disc list-inside space-y-2 text-zinc-600">
              <li>no personal information (name, email, etc.)</li>
              <li>no browsing history or activity logs</li>
              <li>no usage analytics or telemetry</li>
              <li>no cookies for tracking purposes</li>
              <li>no data shared with third parties</li>
            </ul>
          </Section>

          <Section icon={Lock} title="spotify authentication">
            <p>
              tuneport uses spotify's official oauth 2.0 with pkce (proof key for code exchange) 
              for authentication. this is the most secure method available:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-600 mt-4">
              <li>your spotify password is never seen or stored by tuneport</li>
              <li>authentication happens directly with spotify's servers</li>
              <li>access tokens are stored locally in your browser's extension storage</li>
              <li>tokens can be revoked anytime from your spotify account settings</li>
            </ul>
          </Section>

          <Section icon={Eye} title="permissions explained">
            <p className="mb-4">the extension requests these permissions:</p>
            <div className="space-y-3 text-sm">
              <PermissionRow 
                name="tabs / activeTab" 
                reason="read youtube video title from current tab to search spotify" 
              />
              <PermissionRow 
                name="storage" 
                reason="save your preferences and spotify tokens locally" 
              />
              <PermissionRow 
                name="downloads" 
                reason="save audio files to your downloads folder when you request it" 
              />
              <PermissionRow 
                name="notifications" 
                reason="show success/error messages after actions" 
              />
              <PermissionRow 
                name="contextMenus" 
                reason="add 'add to spotify' option when you right-click" 
              />
              <PermissionRow 
                name="identity" 
                reason="handle spotify oauth login flow" 
              />
            </div>
          </Section>

          <Section icon={Server} title="external services">
            <p>tuneport communicates with these services only when you trigger an action:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-600 mt-4">
              <li><strong>spotify api</strong> - to search tracks and add to playlists (requires your auth)</li>
              <li><strong>youtube</strong> - to read video metadata from pages you visit</li>
              <li><strong>download services</strong> (optional) - cobalt.tools or self-hosted yt-dlp when you request downloads</li>
            </ul>
            <p className="mt-4 text-zinc-500 text-sm">
              no data is sent to any service without your explicit action.
            </p>
          </Section>

          <Section icon={Trash2} title="data deletion">
            <p>
              since we don't collect data, there's nothing to delete on our end. 
              to remove all local data:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-zinc-600 mt-4">
              <li>uninstall the extension from your browser</li>
              <li>revoke tuneport access from your <a href="https://www.spotify.com/account/apps/" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">spotify connected apps</a></li>
            </ol>
          </Section>

          <Section icon={Shield} title="open source">
            <p>
              tuneport is open source. you can audit the code yourself at{" "}
              <a 
                href="https://github.com/Microck/tuneport" 
                className="text-emerald-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/Microck/tuneport
              </a>
            </p>
          </Section>

          <div className="border-t pt-8 text-sm text-zinc-500">
            <p>
              questions? open an issue on{" "}
              <a 
                href="https://github.com/Microck/tuneport/issues" 
                className="text-emerald-600 hover:underline"
              >
                github
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ 
  icon: Icon, 
  title, 
  children 
}: { 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      </div>
      <div className="text-zinc-600 leading-relaxed pl-13">
        {children}
      </div>
    </section>
  );
}

function PermissionRow({ name, reason }: { name: string; reason: string }) {
  return (
    <div className="flex gap-4 p-3 rounded-lg bg-zinc-50">
      <code className="text-emerald-600 font-mono text-xs bg-emerald-50 px-2 py-1 rounded whitespace-nowrap h-fit">
        {name}
      </code>
      <span className="text-zinc-600">{reason}</span>
    </div>
  );
}
