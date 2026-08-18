import { CreditCard, Zap } from 'lucide-react';
import Link from 'next/link';

export function BillingCard() {
  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg border border-slate-700/50 relative overflow-hidden flex flex-col justify-between h-40">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full pointer-events-none"></div>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Message Balance</p>
          <h3 className="text-2xl font-bold mt-1 text-white">1,250 <span className="text-xs font-normal text-slate-400">Credits</span></h3>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
          <Zap className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-[10px] text-slate-400">Plan valid till 2027</p>
        <Link href="/billing" className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 transition-colors rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20">
          <CreditCard className="h-3.5 w-3.5" />
          Recharge Now
        </Link>
      </div>
    </div>
  );
}
