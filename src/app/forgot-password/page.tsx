'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      // Always show success to prevent email enumeration
      setSent(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#efe8df] dark:from-[#06130D] dark:to-[#0B2016] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/iscarb-mark.png" alt="iSCARB" className="h-14 w-14 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#181d26] dark:text-[#E6F0E9] tracking-tight">iSCARB</h1>
        </div>

        <div className="bg-white dark:bg-[#0B2016] rounded-3xl border border-[#e8e6e1] dark:border-[#1B4230] shadow-lg p-8">
          {sent ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-[#181d26] dark:text-[#E6F0E9] mb-2">Check Your Email</h2>
              <p className="text-[#5c6570] dark:text-[#97AF9F] text-sm mb-6">
                If an account exists with <strong className="text-[#181d26] dark:text-[#E6F0E9]">{email}</strong>,
                we&apos;ve sent a password reset link. Please check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[#0E6C3C] dark:text-[#35A96A] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#181d26] dark:text-[#E6F0E9] mb-2">Reset Password</h2>
              <p className="text-[#5c6570] dark:text-[#97AF9F] text-sm mb-6">
                Enter your email and we&apos;ll send you a link to reset your password
              </p>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm p-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#181d26] dark:text-[#E6F0E9] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a4aab0] dark:text-[#5A6F63]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#e8e6e1] dark:border-[#1B4230] bg-white dark:bg-[#0B2016] text-[#181d26] dark:text-[#E6F0E9] placeholder-[#a4aab0] dark:placeholder-[#5A6F63] focus:outline-none focus:ring-2 focus:ring-[#0E6C3C] dark:focus:ring-[#35A96A] transition disabled:opacity-50"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-lg bg-[#0E6C3C] dark:bg-[#35A96A] hover:bg-[#0a4f2a] dark:hover:bg-[#2a8f57] text-white py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[#5c6570] dark:text-[#97AF9F]">
                <Link href="/login" className="inline-flex items-center gap-1 text-[#0E6C3C] dark:text-[#35A96A] hover:underline">
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
