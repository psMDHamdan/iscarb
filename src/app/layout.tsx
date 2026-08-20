import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "@fontsource-variable/cairo/wght.css";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/iscarb/QueryProvider";

export const metadata: Metadata = {
  title: "iSCARB — Sovereign Readiness Engine for Saudi Higher Education",
  description:
    "iSCARB (آي-سكارب) is an intelligent readiness layer over university curricula. A generative-AI pipeline turns academic content into workplace simulations, live Saudi-compliance checklists, confidence-scored assessment, AI capstone generation, career mapping, and verifiable proof of capability — aligned to NCAAA, ETEC and Vision 2030.",
  keywords: [
    "iSCARB", "Saudi higher education", "employment readiness", "NCAAA", "ETEC",
    "Vision 2030", "workplace simulation", "AI assessment", "graduate employability",
    "NQF", "capstone generator", "career mapping",
  ],
  authors: [{ name: "iSCARB" }],
  icons: {
    icon: "/iscarb-mark.png",
  },
  openGraph: {
    title: "iSCARB — Sovereign Readiness Engine",
    description:
      "Turn academic content into capability you can prove. A generative-AI pipeline grounded in real Saudi regulation, aligned to NCAAA, ETEC and Vision 2030.",
    siteName: "iSCARB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iSCARB — Sovereign Readiness Engine",
    description:
      "Turn academic content into capability you can prove — grounded in real Saudi regulation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
