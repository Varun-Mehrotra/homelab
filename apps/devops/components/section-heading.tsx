import { type ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
};

export function SectionHeading({ eyebrow, title, children }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">{eyebrow}</p> : null}
      <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      {children ? <div className="mt-5 text-lg leading-8 text-slate-600">{children}</div> : null}
    </div>
  );
}
