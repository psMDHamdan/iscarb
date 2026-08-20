"use client";

/**
 * iSCARB notify — bilingual toast helpers.
 * ===========================================================================
 * The shadcn `<Toaster/>` is mounted in `app/layout.tsx` and `toast()` from
 * `@/hooks/use-toast` is a module-level dispatch (callable outside React), so
 * these helpers can be invoked directly from event handlers:
 *
 *   import { notify } from "@/lib/notify";
 *   const h = notify.generating(lang);   // show a "Generating…" toast
 *   h.dismiss();                          // dismiss it when the result arrives
 *   notify.ok(lang, { en: "Capstone ready", ar: "مشروع التخرّج جاهز" });
 *   notify.fail(lang);                    // generic error toast
 *   notify.fallback(lang);                // "offline mode" info toast
 * ===========================================================================
 */
import { toast } from "@/hooks/use-toast";
import type { Lang } from "@/lib/i18n";

export interface BiText {
  en: string;
  ar: string;
}

function pick(lang: Lang, t: BiText): string {
  return lang === "ar" ? t.ar : t.en;
}

export const notify = {
  /** Long-running AI generation has started. Returns the toast handle. */
  generating(lang: Lang) {
    return toast({
      title: pick(lang, { en: "Generating…", ar: "جارٍ التوليد…" }),
      description: pick(lang, {
        en: "The AI is working. This can take 15–25 seconds.",
        ar: "الذكاء الاصطناعي يعمل. قد يستغرق هذا 15–25 ثانية.",
      }),
    });
  },

  /** Success toast. Pass a bilingual title and optional bilingual body. */
  ok(lang: Lang, title: BiText, body?: BiText) {
    return toast({
      title: pick(lang, title),
      description: body ? pick(lang, body) : undefined,
    });
  },

  /** Generic failure toast (optionally with a specific message). */
  fail(lang: Lang, message?: BiText) {
    return toast({
      variant: "destructive",
      title: pick(lang, { en: "Something went wrong", ar: "حدث خطأ ما" }),
      description: message
        ? pick(lang, message)
        : pick(lang, {
            en: "The request failed. Please try again.",
            ar: "فشل الطلب. يُرجى المحاولة مرة أخرى.",
          }),
    });
  },

  /** AI was unavailable; a deterministic fallback was returned. */
  fallback(lang: Lang) {
    return toast({
      title: pick(lang, {
        en: "Using offline mode",
        ar: "يعمل في الوضع دون اتصال",
      }),
      description: pick(lang, {
        en: "AI was unavailable — a deterministic result was returned.",
        ar: "تعذّر الوصول للذكاء الاصطناعي — أُرجِعت نتيجةٌ حتميةٌ بديلة.",
      }),
    });
  },
};
