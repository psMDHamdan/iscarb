"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export default function TermsOfServicePage() {
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
            <FileText className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Last Updated: August 17, 2026 • Please read these terms carefully before using the iSCARB platform.
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 sm:p-10 space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
            
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the iSCARB Academic Assessment and Faculty Intelligence Platform (“Platform”), 
                you agree to be bound by these Terms of Service (“Terms”) and all applicable Saudi Higher Education regulations and guidelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                2. Academic & Ethical Conduct
              </h2>
              <p>
                Users (Students, Faculty, and Administrators) agree to maintain strict academic integrity. 
                AI-assisted tools on iSCARB are designed to enhance learning and faculty course design:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
                <li>Automated AI scoring and feedback are indicative evaluation tools.</li>
                <li>Faculty members retain full authority over final academic grades and assessments.</li>
                <li>Users must not submit fraudulent evidence, plagiarized works, or falsified documentation.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                3. User Accounts & Security
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. 
                Any unauthorized access or security breaches must be reported immediately to your institution’s system administrator.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                4. Intellectual Property & Course Materials
              </h2>
              <p>
                All institutional course materials, lecture packages, rubrics, and national alignment frameworks (e.g., NCAAA, Jaheziah) 
                remain the property of their respective academic institutions and governing authorities.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                5. Limitation of Liability
              </h2>
              <p>
                iSCARB provides services on an “as is” and “as available” basis. The platform shall not be liable for indirect, 
                incidental, or consequential damages resulting from system downtime or third-party service disruptions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                6. Contact Information
              </h2>
              <p>
                If you have any questions regarding these Terms, please contact our support team at{" "}
                <a href="mailto:support@iscarb.edu.sa" className="text-indigo-400 hover:underline font-medium">
                  support@iscarb.edu.sa
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
