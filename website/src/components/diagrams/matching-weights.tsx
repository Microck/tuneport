import { cn } from "@/lib/utils";

export function MatchingWeightsChart() {
  return (
    <div className="w-full my-8">
      <h4 className="text-sm font-semibold text-slate-900 mb-3">Weighted Scoring Breakdown</h4>
      <div className="relative">
        <div className="flex w-full h-12 rounded-xl overflow-hidden font-medium text-xs sm:text-sm text-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-indigo-500 flex flex-col items-center justify-center hover:bg-indigo-600 transition-colors cursor-help" style={{ width: '50%' }} title="Title Similarity (50%)">
            <span>Title</span>
            <span className="opacity-80 text-[10px]">50%</span>
          </div>
          <div className="bg-emerald-500 flex flex-col items-center justify-center hover:bg-emerald-600 transition-colors cursor-help" style={{ width: '35%' }} title="Artist Similarity (35%)">
            <span>Artist</span>
            <span className="opacity-80 text-[10px]">35%</span>
          </div>
          <div className="bg-amber-500 flex flex-col items-center justify-center hover:bg-amber-600 transition-colors cursor-help" style={{ width: '15%' }} title="Duration Match (15%)">
            <span className="hidden sm:inline">Duration</span>
            <span className="sm:hidden">Time</span>
            <span className="opacity-80 text-[10px]">15%</span>
          </div>
        </div>
        
        {/* Threshold Marker */}
        <div className="absolute top-0 bottom-0 left-[70%] w-px bg-rose-500 z-10 hidden sm:block">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 whitespace-nowrap">
            Pass Threshold (0.7)
          </div>
          <div className="absolute top-0 bottom-0 left-0 w-px border-l-2 border-dashed border-rose-500/50"></div>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono px-1">
        <span>0.0</span>
        <span className="sm:hidden text-rose-500 font-bold">^ 0.7 Pass</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
