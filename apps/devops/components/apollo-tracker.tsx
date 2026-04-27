"use client";

import Script from "next/script";

export function ApolloTracker() {
  return (
    <Script id="apollo-website-tracker" strategy="afterInteractive">
      {`
        function initApollo() {
          var n = Math.random().toString(36).substring(7);
          var o = document.createElement("script");
          o.src = "https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=" + n;
          o.async = true;
          o.defer = true;
          o.onload = function() {
            window.trackingFunctions.onLoad({ appId: "667dc53e1bf3360abed26019" });
          };
          document.head.appendChild(o);
        }
        initApollo();
      `}
    </Script>
  );
}
