'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lock, Clock, CheckCircle, ShieldCheck } from 'lucide-react';

interface ComingSoonViewProps {
  moduleName?: string;
  description?: string;
  estimatedLaunch?: string;
}

export default function ComingSoonView({
  moduleName = 'Platform Module',
  description = 'This feature module is currently undergoing Saudi RDF calibration and security hardening.',
  estimatedLaunch = 'Q3 2026',
}: ComingSoonViewProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center p-6 overflow-hidden bg-[#f7f6f3] text-[#181d26] dark:bg-[#04100A] dark:text-[#E6F0E9] rounded-3xl border border-black/5 dark:border-white/10 shadow-2xl">
      {/* Background Ambient Lights */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#35A96A]/15 blur-[120px] dark:bg-[#0E6C3C]/20 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0F7B8A]/15 blur-[120px] dark:bg-[#0F7B8A]/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl w-full text-center space-y-8 p-8 md:p-12 rounded-3xl bg-white/80 dark:bg-[#0B2016]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl"
      >
        {/* Module Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#0E6C3C]/20 bg-[#0E6C3C]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#0E6C3C] dark:border-[#35A96A]/25 dark:bg-[#35A96A]/10 dark:text-[#58CE95]">
          <Lock size={13} className="text-[#0E6C3C] dark:text-[#58CE95]" />
          <span>Feature Locked &bull; Coming Soon</span>
        </div>

        {/* Header Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-display text-gray-900 dark:text-white">
            {moduleName}
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Clock size={14} className="text-amber-500" />
            <span>Target Release: {estimatedLaunch}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-300">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Saudi RDF Aligned</span>
          </div>
        </div>

        {/* Primary CTA: Take Employability Assessment */}
        <div className="pt-2">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0E6C3C]/10 via-[#35A96A]/10 to-[#0F7B8A]/10 border border-[#0E6C3C]/20 dark:border-[#35A96A]/30 text-left space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0E6C3C] dark:text-[#58CE95]">
              <Sparkles size={16} />
              <span>Available Now: Employability Assessment</span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
              While {moduleName} is being prepared, you can complete your Saudi RDF Employability Assessment to calculate your skill readiness score.
            </p>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0E6C3C] to-[#0F7B8A] text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all hover:scale-[1.02]"
            >
              <span>Take Employability Assessment</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Early Access Notification Form */}
        <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Want priority access when {moduleName} launches?
          </p>
          {subscribed ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20"
            >
              <CheckCircle size={16} />
              <span>You're on the early access list! We'll notify you on launch.</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your university or work email"
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-[#04100A] border border-black/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-[#0E6C3C] dark:text-white"
              />
              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 px-5 py-2.5 text-xs font-semibold rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
