import { ScrollVelocityRow } from "@/components/ui/scroll-based-velocity";

export function VelocitySection() {
  return (
    <section className="w-full py-12 overflow-hidden bg-slate-50/50 border-y border-slate-100">
      <ScrollVelocityRow
        baseVelocity={2}
        className="font-display text-center text-4xl font-bold tracking-[-0.02em] text-slate-200 drop-shadow-sm md:text-7xl md:leading-[5rem] select-none pointer-events-none"
      >
        Sync • Download • Disappear • TunePort •&nbsp;
      </ScrollVelocityRow>
    </section>
  );
}
