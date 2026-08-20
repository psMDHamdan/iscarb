"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
            <ShieldCheck className="h-5 w-5" />
            iSCARB Academic Platform
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-2">
            <Lock className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Last Updated: August 17, 2026 • Your privacy and data protection are paramount at iSCARB.
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                1. Data Protection & Compliance
              </h2>
              <p>
                iSCARB operates in strict compliance with the Saudi Personal Data Protection Law (PDPL) and National Data Governance policies. 
                We are committed to protecting student academic records, faculty content, and organizational data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                2. Information We Collect
              </h2>
              <p>We collect necessary information to provide academic and assessment services:</p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
                <li><strong className="text-slate-200">Account Credentials:</strong> Institutional email, name, role, and university affiliation.</li>
                <li><strong className="text-slate-200">Academic Data:</strong> Assessment responses, submissions, grades, and competency progression records.</li>
                <li><strong className="text-slate-200">System Analytics:</strong> Usage logs, session durations, and telemetry required for performance and security audit trails.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                3. How We Use Your Data
              </h2>
              <p>Your data is strictly utilized for educational and institutional governance purposes:</p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
                <li>Generating personalized AI feedback and learning recommendations.</li>
                <li>Facilitating faculty lecture curation, NCAAA quality alignment, and Jaheziah accreditation reporting.</li>
                <li>Providing institutional deans and admins with aggregated, anonymized performance metrics.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                4. Data Security & Storage
              </h2>
              <p>
                All data is encrypted in transit (TLS 1.3) and at rest (AES-256). 
                We employ role-based access control (RBAC) and row-level security (RLS) to ensure that users can only view authorized academic records.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                5. Third-Party Services
              </h2>
              <p>
                We do not sell, rent, or share personal data with third-party advertisers. 
                AI model requests are processed securely using privacy-preserving endpoints without using student data for model re-training.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                6. Contact Privacy Team
              </h2>
              <p>
                For privacy inquiries or data access requests, please contact our Data Protection Officer at{" "}
                <a href="mailto:dpo@iscarb.edu.sa" className="text-indigo-400 hover:underline font-medium">
                  dpo@iscarb.edu.sa
                </a>.
              </p>
            </section>

          </CardContent>
        </Card>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500 flex justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-300 underline">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-slate-300 underline">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
