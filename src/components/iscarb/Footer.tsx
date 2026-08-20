"use client";

import Link from "next/link";
import { useApp } from "@/lib/store";

export function Footer() {
  const { lang } = useApp();
  const ar = lang === "ar";

  return (
    <footer className="mt-auto border-t border-border bg-ink-section text-white/80">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src="/iscarb-mark.png" alt="iSCARB" className="h-8 w-8" />
              <span className="font-display font-extrabold text-lg text-white">
                <span className="text-iscarb-cyan">i</span><span className="text-iscarb-green">SCARB</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              {ar
                ? "طبقة جاهزية توظيفية ذكية فوق المناهج الجامعية — مدعومة بالذكاء الاصطناعي التوليدي، متوافقة مع PDPL، ومتسقة مع NCAAA و ETEC و رؤية 2030."
                : "An intelligent employment-readiness layer over existing university curricula — powered by generative AI, PDPL-compliant, and aligned to NCAAA, ETEC and Vision 2030."}
            </p>
            <p className="font-arabic text-[11px] text-iscarb-gold mt-3">
              بنك المعرفة · تطوير المهارات · التميز في الأداء
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-white mb-3">
              {ar ? "المنصّة" : "Platform"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><FooterLink href="/student/pipeline" ar={ar} en="AI Pipeline" arLabel="خط المعالجة" /></li>
              <li><FooterLink href="/student/simulation" ar={ar} en="Simulation" arLabel="المحاكاة" /></li>
              <li><FooterLink href="/student/readiness" ar={ar} en="Readiness Scale" arLabel="مقياس الجاهزية" /></li>
              <li><FooterLink href="/student/capstone" ar={ar} en="Capstone Generator" arLabel="مولّد التخرّج" /></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-white mb-3">
              {ar ? "المنظومة" : "Ecosystem"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li><FooterLink href="/student/market" ar={ar} en="Market Intelligence" arLabel="ذكاء السوق" /></li>
              <li><FooterLink href="/student/arena" ar={ar} en="Challenge Arena" arLabel="ساحة التحديات" /></li>
              <li><FooterLink href="/faculty/dashboard" ar={ar} en="Faculty Co-Pilot" arLabel="مساعد الأستاذ" /></li>
              <li><FooterLink href="/student/community" ar={ar} en="Community" arLabel="المجتمع" /></li>
            </ul>
          </div>
        </div>

        <div className="hairline my-8 opacity-30" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} iSCARB · {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {["NCAAA", "ETEC", "Vision 2030", "PDPL", "NQF"].map((b) => (
              <span key={b} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold tracking-wide">
                {b}
              </span>
            ))}
          </div>
          <p className="font-display text-xs font-bold text-iscarb-gold">
            {ar ? "أنا أستطيع، أنا سأفعل" : "I can, I will"}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, ar, en, arLabel }: { href: string; ar: boolean; en: string; arLabel: string }) {
  return (
    <Link href={href} className="text-white/60 hover:text-iscarb-cyan transition-colors text-left">
      {ar ? arLabel : en}
    </Link>
  );
}
