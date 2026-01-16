import { Terminal, Copy, ExternalLink, Music2 } from "lucide-react";

export function SetupGuide() {
  return (
    <section className="w-full py-20 bg-tf-background text-white border-t border-tf-border/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 mb-4">
            Installation & Setup
          </h2>
          <p className="text-tf-slate-muted max-w-2xl mx-auto">
            TunePort requires your own Spotify Client ID to ensure unlimited access and persistent login. It takes about 2 minutes to set up.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-tf-emerald/10 flex items-center justify-center text-tf-emerald font-bold border border-tf-emerald/20">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Install Extension</h3>
                <p className="text-tf-slate-muted text-sm leading-relaxed">
                  Download the latest release, unzip it, and load it into Chrome via <code className="bg-tf-gray/30 px-1.5 py-0.5 rounded text-tf-slate-light text-xs">chrome://extensions</code> (Developer Mode must be on).
                </p>
                <a 
                  href="https://github.com/Microck/tuneport/releases" 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-xs font-bold text-tf-emerald hover:text-tf-emerald-light transition-colors mt-2"
                >
                  Download Latest <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-tf-emerald/10 flex items-center justify-center text-tf-emerald font-bold border border-tf-emerald/20">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Create Spotify App</h3>
                <p className="text-tf-slate-muted text-sm leading-relaxed">
                  Go to the Spotify Developer Dashboard and click "Create App". Give it any name (e.g., "My TunePort").
                </p>
                <a 
                  href="https://developer.spotify.com/dashboard" 
                  target="_blank"
                  className="inline-flex items-center gap-2 text-xs font-bold text-tf-emerald hover:text-tf-emerald-light transition-colors mt-2"
                >
                  Open Dashboard <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-tf-emerald/10 flex items-center justify-center text-tf-emerald font-bold border border-tf-emerald/20">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Add Redirect URI</h3>
                <p className="text-tf-slate-muted text-sm leading-relaxed">
                  In your Spotify App settings, paste the Redirect URI shown in the TunePort extension setup screen.
                </p>
                <div className="bg-tf-gray/30 p-3 rounded-lg border border-tf-border mt-2 font-mono text-xs text-tf-slate-light break-all">
                  https://&lt;extension-id&gt;.chromiumapp.org/
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-tf-emerald/10 flex items-center justify-center text-tf-emerald font-bold border border-tf-emerald/20">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">Copy Client ID</h3>
                <p className="text-tf-slate-muted text-sm leading-relaxed">
                  Copy the <strong>Client ID</strong> from the dashboard and paste it into TunePort. You're done!
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-tf-emerald/20 to-transparent rounded-3xl blur-3xl" />
            <div className="relative bg-tf-gray/20 backdrop-blur-xl rounded-2xl border border-tf-border p-6 h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-tf-emerald rounded-2xl flex items-center justify-center shadow-lg shadow-tf-emerald/20">
                <Music2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">Why do I need this?</h4>
                <p className="text-sm text-tf-slate-muted leading-relaxed max-w-sm mx-auto">
                  Spotify requires verified quotas for public apps. By using your own Client ID (Developer Mode), you get your own personal quota limit, ensuring TunePort never hits rate limits for you.
                </p>
              </div>
              <div className="flex gap-2 text-xs font-mono bg-black/20 p-2 rounded-lg border border-tf-border/50 text-tf-emerald">
                <Terminal className="w-4 h-4" />
                <span>Unlimited API Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
