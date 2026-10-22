'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryCharging, Flame } from 'lucide-react';

export function SmartphoneFrame({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState('23:45');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center bg-[#040209] text-slate-100 relative overflow-hidden">
      {/* Ambient Neon Glows (Desktop) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden hidden md:block z-0">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[550px] h-[550px] bg-rose-600/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      {/* Desktop Mode Toggle Bar */}
      <div className="hidden md:flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl my-1.5 z-40 text-xs shadow-2xl shrink-0">
        <span className="text-slate-300 font-bold flex items-center gap-1.5 px-2">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span className="tracking-wide">COLPO BASSO</span>
        </span>
        <div className="w-px h-4 bg-white/10" />
        
        <button
          type="button"
          onClick={() => {
            setIsFrameEnabled(true);
            setOrientation('landscape');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
            isFrameEnabled && orientation === 'landscape'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Vista smartphone orizzontale (stile UNO Mobile)"
        >
          <Smartphone className="w-3.5 h-3.5 rotate-90" />
          <span>Orizzontale (UNO)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsFrameEnabled(true);
            setOrientation('portrait');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
            isFrameEnabled && orientation === 'portrait'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Vista smartphone verticale"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Verticale</span>
        </button>

        <button
          type="button"
          onClick={() => setIsFrameEnabled(false)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
            !isFrameEnabled
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Schermo intero senza cornice smartphone"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Schermo Intero</span>
        </button>
      </div>

      {/* Main Container: Responsive smartphone landscape or portrait */}
      <div
        className={`w-full bg-[#06030f] flex flex-col relative z-10 transition-all duration-300 ${
          isFrameEnabled
            ? orientation === 'landscape'
              ? 'max-w-[920px] h-dvh md:h-[min(510px,calc(100dvh-54px))] md:mb-1 md:rounded-[36px] md:border-[6px] md:border-[#22163a] md:shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(244,63,94,0.2)] overflow-hidden'
              : 'max-w-[420px] h-dvh md:h-[min(820px,calc(100dvh-54px))] md:mb-1 md:rounded-[38px] md:border-[6px] md:border-[#22163a] md:shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(244,63,94,0.2)] overflow-hidden'
            : 'max-w-none w-full h-dvh md:rounded-none md:border-0 overflow-hidden'
        }`}
      >
        {isFrameEnabled && (
          <div className="hidden md:flex items-center justify-between px-6 pt-1 pb-1 shrink-0 bg-black/50 border-b border-white/5 z-30 select-none">
            <span className="text-[11px] font-bold text-white tracking-tight">{currentTime}</span>
            <div className="w-16 h-3 bg-black rounded-full flex items-center justify-end px-2 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#120a22] border border-[#2b194f]" />
            </div>
            <div className="flex items-center gap-1 text-slate-300 text-[10px]">
              <Wifi className="w-3 h-3" />
              <span className="font-bold">5G</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        )}

        {/* App Viewport */}
        <div className="flex-1 min-h-0 w-full flex flex-col relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
