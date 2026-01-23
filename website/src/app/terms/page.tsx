import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Scale, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Service - TunePort",
  description: "TunePort terms of service and usage guidelines.",
  openGraph: {
    title: "Terms of Service - TunePort",
    description: "TunePort terms of service and usage guidelines.",
    url: "https://tuneport.micr.dev/terms",
    type: "article",
  },
};

export default function TermsPage() {
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
          terms of service
        </h1>
        <p className="text-zinc-500 mb-12">last updated: january 2025</p>

        <div className="space-y-12">
          <Section icon={FileText} title="acceptance of terms">
            <p>
              by using tuneport, you agree to these terms. if you don't agree, 
              please don't use the extension. these terms apply to all users.
            </p>
          </Section>

          <Section icon={Globe} title="description of service">
            <p>tuneport is a browser extension that:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-600 mt-4">
              <li>matches youtube videos to spotify tracks</li>
              <li>adds matched tracks to your spotify playlists</li>
              <li>optionally downloads audio files locally</li>
            </ul>
            <p className="mt-4 text-zinc-500 text-sm">
              tuneport is provided "as is" without warranties of any kind.
            </p>
          </Section>

          <Section icon={Shield} title="your responsibilities">
            <p>you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-600 mt-4">
              <li>use tuneport in compliance with all applicable laws</li>
              <li>respect copyright and intellectual property rights</li>
              <li>not use the extension for commercial redistribution of content</li>
              <li>not attempt to reverse engineer or modify the extension maliciously</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="content & copyright">
            <p>
              tuneport does not host, store, or distribute any copyrighted content. 
              the extension facilitates matching and organization of content you already 
              have access to through legitimate services (youtube, spotify).
            </p>
            <p className="mt-4">
              downloading audio is your responsibility. ensure you have the right to 
              download any content. tuneport is not responsible for how you use 
              downloaded files.
            </p>
          </Section>

          <Section icon={Scale} title="limitation of liability">
            <p>
              to the maximum extent permitted by law, tuneport and its developers 
              shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages arising from your use of the extension.
            </p>
            <p className="mt-4 text-zinc-500 text-sm">
              this includes but is not limited to: loss of data, service interruptions, 
              or issues with third-party services (spotify, youtube).
            </p>
          </Section>

          <Section icon={FileText} title="third-party services">
            <p>tuneport interacts with third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-600 mt-4">
              <li><strong>spotify</strong> - governed by spotify's terms of service</li>
              <li><strong>youtube</strong> - governed by youtube's terms of service</li>
              <li><strong>download services</strong> - cobalt.tools or self-hosted yt-dlp</li>
            </ul>
            <p className="mt-4 text-zinc-500 text-sm">
              we are not responsible for changes or issues with these services.
            </p>
          </Section>

          <Section icon={FileText} title="changes to terms">
            <p>
              we may update these terms at any time. continued use of tuneport after 
              changes constitutes acceptance of the new terms. check this page 
              periodically for updates.
            </p>
          </Section>

          <Section icon={Globe} title="open source">
            <p>
              tuneport is open source under the MIT license. you can view, fork, and 
              contribute to the code at{" "}
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
              questions? contact us at{" "}
              <a 
                href="mailto:contact@micr.dev" 
                className="text-emerald-600 hover:underline"
              >
                contact@micr.dev
              </a>
              {" "}or open an issue on{" "}
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
