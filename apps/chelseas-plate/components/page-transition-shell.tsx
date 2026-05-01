"use client";

import React, { useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

type PageTransitionShellProps = {
  children: React.ReactNode;
};

type EnterDirection = "forward" | "back" | null;

const ENTER_STORAGE_KEY = "chelseas-plate:enter-direction";
const TRANSITION_MS = 1000;

export function PageTransitionShell({ children }: PageTransitionShellProps) {
  const pathname = usePathname();
  const [enterDirection, setEnterDirection] = useState<EnterDirection>(null);
  const [isTransitionReady, setIsTransitionReady] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextDirection = window.sessionStorage.getItem(ENTER_STORAGE_KEY);
    if (nextDirection === "forward" || nextDirection === "back") {
      setEnterDirection(nextDirection);
      setIsTransitionReady(true);
      window.sessionStorage.removeItem(ENTER_STORAGE_KEY);
      window.scrollTo(0, 0);

      const overlay = document.querySelector(".page-transition-overlay");
      if (overlay instanceof HTMLElement) {
        const timeoutId = window.setTimeout(() => {
          overlay.remove();
        }, TRANSITION_MS);

        const enterTimeoutId = window.setTimeout(() => {
          setEnterDirection(null);
          setIsTransitionReady(false);
        }, TRANSITION_MS);

        return () => {
          window.clearTimeout(timeoutId);
          window.clearTimeout(enterTimeoutId);
        };
      }

      const enterTimeoutId = window.setTimeout(() => {
        setEnterDirection(null);
        setIsTransitionReady(false);
      }, TRANSITION_MS);

      return () => window.clearTimeout(enterTimeoutId);
    }

    setEnterDirection(null);
    setIsTransitionReady(false);
  }, [pathname]);

  return (
    <div
      className={`page-transition-shell ${
        enterDirection ? `page-transition-shell-enter-${enterDirection}` : ""
      } ${isTransitionReady ? "page-transition-shell-ready" : ""}`}
    >
      {children}
    </div>
  );
}

export { ENTER_STORAGE_KEY };
