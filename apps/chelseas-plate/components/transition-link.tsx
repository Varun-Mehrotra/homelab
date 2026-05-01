"use client";

import React from "react";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { ENTER_STORAGE_KEY } from "@/components/page-transition-shell";

type TransitionDirection = "forward" | "back";

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

    const existingOverlay = shell.querySelector(".page-transition-overlay");
    existingOverlay?.remove();

    const overlay = stage.cloneNode(true);
    if (!(overlay instanceof HTMLElement)) {
      return;
    }

    overlay.classList.add("page-transition-overlay");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.top = `${stage.offsetTop}px`;
    overlay.style.left = `${stage.offsetLeft}px`;
    overlay.style.width = `${stage.offsetWidth}px`;
    overlay.style.height = `${stage.offsetHeight}px`;
    shell.appendChild(overlay);
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
      router.push(typeof href === "string" ? href : href.toString());
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
