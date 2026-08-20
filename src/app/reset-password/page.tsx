'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#efe8df] dark:from-[#06130D] dark:to-[#0B2016] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E6C3C]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [missingToken, setMissingToken] = useState(false);

  useEffect(() => {
    if (!token) {
      setMissingToken(true);
      setError('Missing or invalid reset token. Please request a new password reset link.');
    }
  }, [token]);

  // Password strength indicators
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (newPassword.length === 0) return '';
    if (strengthScore <= 1) return { label: 'Weak', color: 'bg-red-500' };
    if (strengthScore <= 2) return { label: 'Fair', color: 'bg-amber-500' };
    if (strengthScore <= 3) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Please request a new link.');
      return;
    }

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!hasUpper || !hasLower || !hasNumber) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (missingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#efe8df] dark:from-[#06130D] dark:to-[#0B2016] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0B2016] rounded-3xl border border-[#e8e6e1] dark:border-[#1B4230] shadow-lg p-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#181d26] dark:text-[#E6F0E9] mb-2">Invalid Link</h2>
            <p className="text-[#5c6570] dark:text-[#97AF9F] text-sm mb-6">
              This password reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E6C3C] dark:bg-[#35A96A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a4f2a] dark:hover:bg-[#2a8f57] transition"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#efe8df] dark:from-[#06130D] dark:to-[#0B2016] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0B2016] rounded-3xl border border-[#e8e6e1] dark:border-[#1B4230] shadow-lg p-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#181d26] dark:text-[#E6F0E9] mb-2">Password Reset!</h2>
            <p className="text-[#5c6570] dark:text-[#97AF9F] text-sm mb-6">
              Your password has been successfully reset. All existing sessions have been terminated for security.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E6C3C] dark:bg-[#35A96A] text-white rounded-lg text-sm font-semibold hover:bg-[#0a4f2a] dark:hover:bg-[#2a8f57] transition"
            >
              Sign In with New Password
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#efe8df] dark:from-[#06130D] dark:to-[#0B2016] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <img src="/iscarb-mark.png" alt="iSCARB" className="h-14 w-14 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#181d26] dark:text-[#E6F0E9] tracking-tight">iSCARB</h1>
        </div>

        <div className="bg-white dark:bg-[#0B2016] rounded-3xl border border-[#e8e6e1] dark:border-[#1B4230] shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#181d26] dark:text-[#E6F0E9] mb-2">Set New Password</h2>
          <p className="text-[#5c6570] dark:text-[#97AF9F] text-sm mb-6">
            Enter your new password. Must be at least 12 characters with uppercase, lowercase, and numbers.
          </p>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-sm p-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#181d26] dark:text-[#E6F0E9] mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a4aab0] dark:text-[#5A6F63]" />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-[#e8e6e1] dark:border-[#1B4230] bg-white dark:bg-[#0B2016] text-[#181d26] dark:text-[#E6F0E9] placeholder-[#a4aab0] dark:placeholder-[#5A6F63] focus:outline-none focus:ring-2 focus:ring-[#0E6C3C] dark:focus:ring-[#35A96A] transition disabled:opacity-50"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a4aab0] dark:text-[#5A6F63] hover:text-[#181d26] dark:hover:text-[#E6F0E9]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password requirements */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden`}>
                    {strength && (
                      <div className={`h-full ${strength.color} transition-all`} style={{ width: `${(strengthScore / 4) * 100}%` }} />
                    )}
                  </div>
                  {strength && <span className="font-medium text-[#5c6570] dark:text-[#97AF9F] min-w-[3rem] text-right">{strength.label}</span>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <RequirementCheck met={hasMinLength} label="At least 12 characters" />
                  <RequirementCheck met={hasUpper} label="Uppercase letter" />
                  <RequirementCheck met={hasLower} label="Lowercase letter" />
                  <RequirementCheck met={hasNumber} label="Number" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#181d26] dark:text-[#E6F0E9] mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-[#0B2016] text-[#181d26] dark:text-[#E6F0E9] placeholder-[#a4aab0] dark:placeholder-[#5A6F63] focus:outline-none focus:ring-2 focus:ring-[#0E6C3C] dark:focus:ring-[#35A96A] transition disabled:opacity-50 ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-300 dark:border-red-700'
                    : passwordsMatch
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-[#e8e6e1] dark:border-[#1B4230]'
                }`}
                placeholder="Confirm new password"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-emerald-500 mt-1">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordsMatch || strengthScore < 4 || !token}
              className="w-full rounded-lg bg-[#0E6C3C] dark:bg-[#35A96A] hover:bg-[#0a4f2a] dark:hover:bg-[#2a8f57] text-white py-3 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#5c6570] dark:text-[#97AF9F]">
            <Link href="/login" className="text-[#0E6C3C] dark:text-[#35A96A] hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RequirementCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className={`h-2 w-2 rounded-full flex-shrink-0 ${
          met ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />
      <span className={met ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#5c6570] dark:text-[#97AF9F]'}>
        {label}
      </span>
    </div>
  );
}
