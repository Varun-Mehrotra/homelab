"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!measurementId) {
      console.info("[ga4] NEXT_PUBLIC_GA_MEASUREMENT_ID is not set; analytics disabled.");
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.info("[ga4] Analytics initialized for", measurementId);
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    console.info("[ga4] Sending page_view", {
      measurementId,
      pagePath,
      pageLocation: window.location.href,
      pageTitle: document.title,
      gtagReady: typeof window.gtag === "function",
    });

    window.gtag?.("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
      send_to: measurementId,
    });
  }, [pathname, searchParams]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.info("[ga4] Loaded gtag.js for", measurementId);
        }}
        onError={() => {
          console.error("[ga4] Failed to load gtag.js for", measurementId);
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
