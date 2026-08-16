import { motion } from 'framer-motion';
import { Search, RefreshCw, ShieldCheck, Megaphone } from 'lucide-react';
import keysAsset from '../assets/portal/keys_asset.jpg';
import handshakeAsset from '../assets/portal/handshake_asset.jpg';

export default function CampusHeroVisual() {
  return (
    <div className="relative w-full max-w-[500px] h-[520px] mx-auto flex items-center justify-center select-none pointer-events-none sm:pointer-events-auto">
      {/* Ambient Blue Radial Glow behind the floating interface */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[340px] h-[340px] rounded-full bg-cyan-400/15 blur-[70px] pointer-events-none" />
        <div className="w-[280px] h-[380px] rounded-full bg-blue-600/25 blur-[90px] pointer-events-none" />
      </div>

      {/* ─── 1. Central Smartphone / App Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[270px] sm:w-[290px] h-[440px] rounded-[38px] bg-gradient-to-b from-white/95 via-slate-100/90 to-slate-200/85 backdrop-blur-xl p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.4)] flex flex-col justify-between overflow-hidden"
      >
        {/* Top Phone Pill Bar */}
        <div className="w-full flex items-center justify-between px-3 pt-1 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-slate-300/80 mx-auto" />
        </div>

        {/* Central Display Area: Lost Item (Leather Key Ring + Map Pin) */}
        <div className="relative flex-1 rounded-[28px] bg-gradient-to-b from-slate-100 to-slate-200/90 overflow-hidden flex items-center justify-center border border-white/60 shadow-inner group">
          <img
            src={keysAsset}
            alt="Reported Lost Leather Key Ring"
            className="w-full h-full object-cover transform scale-105 transition-transform duration-700 hover:scale-110"
          />
          {/* Subtle item gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/30 to-transparent" />
        </div>

        {/* Bottom Phone Bar with 3 indicator dots */}
        <div className="pt-3 pb-1 flex items-center justify-center gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-slate-400/80 bg-transparent" />
          <span className="w-4 h-4 rounded-full border-2 border-slate-400/80 bg-transparent" />
          <span className="w-4 h-4 rounded-full border-2 border-slate-400/80 bg-transparent" />
        </div>
      </motion.div>

      {/* ─── 2. Top-Left Floating Search Badge ─── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
        className="absolute left-[6%] top-[24%] z-20"
      >
        <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.25)] border border-white/80 flex items-center justify-center text-slate-600 hover:scale-105 transition-transform">
          <Search size={20} strokeWidth={2.5} className="text-slate-600" />
        </div>
      </motion.div>

      {/* ─── 3. Top-Right Floating Refresh / Match Badge ─── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: 'spring', stiffness: 200 }}
        className="absolute right-[12%] top-[14%] z-20"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-[0_10px_25px_rgba(6,182,212,0.4)] border border-cyan-300/60 flex items-center justify-center text-white hover:rotate-45 transition-transform">
          <RefreshCw size={22} strokeWidth={2.4} />
        </div>
      </motion.div>

      {/* ─── 4. Right Side Floating 85% Match Card ─── */}
      <motion.div
        initial={{ opacity: 0, x: 25 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute right-[2%] top-[30%] z-20"
      >
        <div className="w-24 sm:w-28 rounded-2xl bg-white/95 backdrop-blur-md p-3 shadow-[0_15px_35px_rgba(0,0,0,0.2)] border border-white/90 flex flex-col items-center text-center">
          {/* Circular Progress Gauge */}
          <div className="relative w-12 h-12 flex items-center justify-center mb-1">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600"
                strokeDasharray="85, 100"
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[12px] font-black text-slate-800 tracking-tight">85%</span>
          </div>
          <div className="text-[12px] font-bold text-slate-700 leading-tight">85%</div>
          <div className="text-[11px] font-semibold text-slate-500 leading-tight">match</div>
        </div>
      </motion.div>

      {/* ─── 5. Security Verification Shield Badge ─── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: 'spring' }}
        className="absolute right-[8%] top-[56%] z-20"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_10px_25px_rgba(2,132,199,0.35)] border border-cyan-300/50 flex items-center justify-center text-white">
          <ShieldCheck size={24} strokeWidth={2.3} />
        </div>
      </motion.div>

      {/* ─── 6. Lower Left Floating Student Handover Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-[2%] bottom-[6%] z-30"
      >
        <div className="w-40 sm:w-48 rounded-2xl bg-white/90 backdrop-blur-xl p-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.3)] border border-white/80">
          <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden shadow-sm">
            <img
              src={handshakeAsset}
              alt="Safe Student Handover"
              className="w-full h-full object-cover object-top"
            />
            {/* Center Handshake Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20">
              <div className="w-8 h-8 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-md border border-white/60">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4l-2-2" />
                  <path d="m18 10 1-1a2 2 0 0 0 0-2.8l-2.2-2.2a2 2 0 0 0-2.8 0l-5 5" />
                  <path d="m2 14 6 6" />
                  <path d="m7 19-3-3a2 2 0 0 1 0-2.8l2.2-2.2a2 2 0 0 1 2.8 0l2 2" />
                </svg>
              </div>
            </div>
          </div>
          {/* Subtle UI skeleton lines below photo */}
          <div className="mt-2.5 space-y-1.5 px-0.5">
            <div className="h-2.5 w-3/4 rounded-full bg-slate-300/70" />
            <div className="h-2 w-1/2 rounded-full bg-slate-200/80" />
          </div>
        </div>
      </motion.div>

      {/* ─── 7. University Announcement Notification Badge ─── */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
        className="absolute left-[38%] sm:left-[36%] bottom-[2%] z-40"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-white to-slate-50 shadow-[0_16px_35px_rgba(0,0,0,0.35)] border-4 border-blue-600 flex flex-col items-center justify-center text-center p-1.5 hover:scale-105 transition-transform cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white mb-1 shadow-sm group-hover:scale-110 transition-transform">
            <Megaphone size={14} className="stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-slate-800 leading-[1.1] text-center max-w-[68px]">
            University announcement
          </span>
        </div>
      </motion.div>
    </div>
  );
}
