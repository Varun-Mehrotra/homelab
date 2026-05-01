"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { ENTER_STORAGE_KEY } from "@/components/page-transition-shell";

type TransitionDirection = "forward" | "back";
const SNAPSHOT_STICKY_SELECTORS = [".crumb-rail", ".filter"];

type TransitionLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    direction: TransitionDirection;
  };

export function TransitionLink({ direction, onClick, href, children, ...props }: TransitionLinkProps) {
  const router = useRouter();

  function mountOverlaySnapshot() {
    const shell = document.querySelector(".shell");
    const stage = document.querySelector(".page-transition-shell");

    if (!(shell instanceof HTMLElement) || !(stage instanceof HTMLElement)) {
      return;
    }

    const existingOverlay = document.querySelector(".page-transition-overlay");
    existingOverlay?.remove();

    const stageRect = stage.getBoundingClientRect();
    const stageDocTop = stageRect.top + window.scrollY;
    const visibleOffset = Math.max(0, window.scrollY - stageDocTop);
    const overlayTop = Math.max(stageRect.top, 0);

    const overlay = document.createElement("div");
    overlay.classList.add("page-transition-overlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.top = `${overlayTop}px`;
    overlay.style.left = `${stageRect.left}px`;
    overlay.style.width = `${stageRect.width}px`;
    overlay.style.height = `${Math.max(window.innerHeight - overlayTop, 0)}px`;

    const snapshot = stage.cloneNode(true);
    if (!(snapshot instanceof HTMLElement)) {
      return;
    }

    snapshot.classList.remove(
      "page-transition-shell-enter-forward",
      "page-transition-shell-enter-back",
      "page-transition-shell-ready",
    );
    snapshot.style.position = "relative";
    snapshot.style.transform = `translateY(-${visibleOffset}px)`;
    snapshot.style.minHeight = `${stage.offsetHeight}px`;

    for (const selector of SNAPSHOT_STICKY_SELECTORS) {
      const originals = Array.from(stage.querySelectorAll<HTMLElement>(selector));
      const clones = Array.from(snapshot.querySelectorAll<HTMLElement>(selector));

      originals.forEach((original, index) => {
        const clone = clones[index];
        if (!clone) {
          return;
        }

        const rect = original.getBoundingClientRect();
        clone.style.visibility = "hidden";

        const frozenClone = clone.cloneNode(true);
        if (!(frozenClone instanceof HTMLElement)) {
          return;
        }

        frozenClone.style.position = "absolute";
        frozenClone.style.top = `${rect.top - overlayTop + visibleOffset}px`;
        frozenClone.style.left = `${rect.left - stageRect.left}px`;
        frozenClone.style.width = `${rect.width}px`;
        frozenClone.style.zIndex = window.getComputedStyle(original).zIndex;
        frozenClone.style.visibility = "visible";
        snapshot.appendChild(frozenClone);
      });
    }

    overlay.appendChild(snapshot);
    document.body.appendChild(overlay);
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === "_blank"
    ) {
      return;
    }

    event.preventDefault();

    if (typeof window !== "undefined") {
      mountOverlaySnapshot();
      window.sessionStorage.setItem(ENTER_STORAGE_KEY, direction);
      router.push(typeof href === "string" ? href : href.toString(), { scroll: false });
    } else {
      router.push(typeof href === "string" ? href : href.toString());
    }
  }

  return (
    <Link {...props} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
