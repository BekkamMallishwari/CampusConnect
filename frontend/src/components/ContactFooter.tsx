import { useState } from 'react';
import { Mail, Globe, Heart, Sparkles, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';

const LinkedinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const DiscordIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export default function ContactFooter() {
  const reduceMotion = useReducedMotion();
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const handleCopyDiscord = async () => {
    try {
      await navigator.clipboard.writeText('mallishwari_23');
      setCopiedDiscord(true);
      toast.success('Discord ID copied: mallishwari_23');
      setTimeout(() => setCopiedDiscord(false), 2200);
    } catch {
      toast.error('Discord: mallishwari_23');
    }
  };

  return (
    <motion.footer
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="glass-footer w-full overflow-hidden p-6 sm:p-7 transition-colors duration-200"
    >
      {/* Main 3-column footer content */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-3 items-start">
        {/* Left: Brand & Statement */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-[15px] font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                Campus<span style={{ color: 'var(--dash-accent)' }}>Connect</span>
              </h3>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--dash-text-muted)' }}>
                University Portal
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed italic" style={{ color: 'var(--dash-text-secondary)' }}>
            &ldquo;Making campus lost &amp; found simpler, faster, and more connected.&rdquo;
          </p>
          <p className="mt-2 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
            Powered by AI item matching &amp; verified peer handovers.
          </p>
        </div>

        {/* Center: Contact Me - LOGOS ONLY */}
        <div className="flex flex-col items-start md:items-center">
          <div>
            <h4 className="text-[13px] font-extrabold tracking-wide uppercase" style={{ color: 'var(--dash-text-primary)' }}>
              Contact Me
            </h4>
            <div className="mt-3 flex items-center gap-2">
              {/* Mail */}
              <a
                href="mailto:bekkammallishwari1209@gmail.com"
                className="footer-contact-icon-btn"
                aria-label="Email"
                title="Email: bekkammallishwari1209@gmail.com"
              >
                <Mail size={16} className="text-purple-600 dark:text-purple-400" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/mallishwari-bekkam-90b9a2327"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-icon-btn"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <span className="text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <LinkedinIcon />
                </span>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/BekkamMallishwari"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-icon-btn"
                aria-label="GitHub"
                title="GitHub"
              >
                <span className="text-slate-800 dark:text-slate-200 flex items-center justify-center">
                  <GithubIcon />
                </span>
              </a>

              {/* Discord */}
              <button
                type="button"
                onClick={handleCopyDiscord}
                className="footer-contact-icon-btn"
                aria-label="Discord: mallishwari_23"
                title={copiedDiscord ? 'Copied: mallishwari_23' : 'Discord: mallishwari_23 (Click to copy)'}
              >
                {copiedDiscord ? (
                  <Check size={15} className="text-emerald-500" />
                ) : (
                  <span className="text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <DiscordIcon />
                  </span>
                )}
              </button>

              {/* Portfolio */}
              <a
                href="https://bekkammallishwari.github.io/portfolio-final/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-icon-btn"
                aria-label="Portfolio"
                title="Portfolio"
              >
                <Globe size={16} className="text-cyan-600 dark:text-cyan-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Right: Copyright & Badge */}
        <div className="flex flex-col items-start md:items-end text-left md:text-right">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10.5px] font-bold text-slate-700 dark:text-slate-300"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Campus Network
          </div>
          <p className="mt-3 text-[12px] font-bold" style={{ color: 'var(--dash-text-primary)' }}>
            CampusConnect System
          </p>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
            &copy; 2026 CampusConnect. All rights reserved.
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>
            Made with <Heart size={11} className="fill-rose-500 text-rose-500 inline" /> for students &amp; staff
          </p>
        </div>
      </div>

      {/* Sub-bar divider & bottom note */}
      <div className="mt-6 border-t border-[rgba(148,163,184,0.15)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
        <span>CampusConnect · University Lost &amp; Found Intelligence Platform</span>
        <span>All verified reports encrypted &amp; peer-secured</span>
      </div>
    </motion.footer>
  );
}
