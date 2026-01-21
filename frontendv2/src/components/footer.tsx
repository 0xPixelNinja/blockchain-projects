import { Shield, Wifi, ChevronRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#050505] border-t-4 border-slate-800 relative mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-l border-r border-slate-900/50">
        {/* Decorative Industrial Marks */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black px-4 text-slate-700 text-xs font-bold tracking-widest border border-slate-800">
          SECURE_VAULT_LOCK
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2 text-white font-black text-2xl tracking-tighter">
              <Shield className="fill-white text-white w-8 h-8" />
              <span>BLACKBOX</span>
            </div>
            <div className="flex space-x-6 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              <a
                href="#"
                className="hover:text-blue-500 hover:underline decoration-blue-500 underline-offset-4"
              >
                Manifesto
              </a>
              <a
                href="#"
                className="hover:text-blue-500 hover:underline decoration-blue-500 underline-offset-4"
              >
                API Access
              </a>
              <a
                href="#"
                className="hover:text-blue-500 hover:underline decoration-blue-500 underline-offset-4"
              >
                Cold Storage
              </a>
              <a
                href="#"
                className="hover:text-blue-500 hover:underline decoration-blue-500 underline-offset-4"
              >
                Legal
              </a>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="border border-slate-800 bg-black p-4 w-full md:w-80">
              <div className="text-[9px] text-slate-600 mb-2 uppercase tracking-widest">
                Newsletter Uplink
              </div>
              <div className="flex">
                <input
                  type="email"
                  placeholder="ENTER_SIGNAL"
                  className="bg-slate-900 border-none text-white text-xs p-3 w-full focus:ring-0 focus:outline-none placeholder-slate-700 font-mono"
                />
                <button className="bg-slate-200 text-black px-4 font-bold hover:bg-blue-600 hover:text-white transition-none duration-0">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Line */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex justify-between items-center text-[9px] text-slate-700 uppercase tracking-widest font-mono">
          <span>Sys_Ver 4.0.2</span>
          <span className="flex items-center gap-2">
            <Wifi size={10} /> Network Stable
          </span>
          <span>© 2024 Blackbox Systems</span>
        </div>
      </div>
    </footer>
  );
}
