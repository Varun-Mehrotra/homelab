"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsProps = {
  measurementId?: string;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!measurementId) {
      console.info("[ga4] NEXT_PUBLIC_GA_MEASUREMENT_ID is not set; analytics disabled.");
      return;
    }

    if (!isLoaded) {
      console.info("[ga4] Waiting for gtag.js to load before sending page_view.", {
        measurementId,
      });
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedPath.current === pagePath) {
      return;
    }

    lastTrackedPath.current = pagePath;

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
  }, [isLoaded, measurementId, pathname, searchParams]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => {
          setIsLoaded(true);
          console.info("[ga4] Analytics initialized for", measurementId);
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
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
