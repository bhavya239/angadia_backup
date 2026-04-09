import { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-black relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Main Glass/Split Container */}
      <div className="max-w-5xl w-full flex flex-col md:flex-row bg-white/10 backdrop-blur-2xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* LEFT PANEL: Branding & Aesthetics */}
        <div className="md:w-5/12 bg-gradient-to-b from-indigo-600/90 to-blue-900/90 p-10 lg:p-14 flex flex-col justify-between text-white relative border-r border-white/10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-5 drop-shadow-lg leading-tight">
              Angadia Pedhi
            </h1>
            <p className="text-indigo-100/90 text-lg font-medium leading-relaxed max-w-sm">
              Enterprise ledger management and secure hawala operations platform. Access requires clearance.
            </p>
          </div>
          
          <div className="relative z-10 mt-16 md:mt-0">
            <div className="pl-5 border-l-4 border-indigo-400/80">
              <p className="text-base font-semibold text-indigo-50 leading-relaxed">
                "Streamlining private financial logistics with absolute precision and trust."
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Form Area */}
        <div className="md:w-7/12 bg-white px-8 py-12 sm:p-12 lg:p-16 flex flex-col justify-center">
          
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{title}</h2>
            <p className="text-slate-500 font-medium text-lg">{subtitle}</p>
          </div>

          {children}
        </div>

      </div>
    </div>
  );
}
