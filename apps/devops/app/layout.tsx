import { ApolloTracker } from "@/components/apollo-tracker";
import type { Metadata } from "next";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Geist, Manrope } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

export const dynamic = "force-dynamic";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "WebGuru | AI-assisted internal tooling for DevOps and platform teams",
  description:
    "AI-assisted internal tooling for DevOps, platform engineering, and SRE teams. Bespoke internal systems for incident triage, release workflows, self-service, and operational leverage.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geist.variable} ${manrope.variable} bg-stone-50 text-slate-950 antialiased`}>
        <ApolloTracker />
        <Suspense fallback={null}>
          <GoogleAnalytics measurementId={measurementId} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
