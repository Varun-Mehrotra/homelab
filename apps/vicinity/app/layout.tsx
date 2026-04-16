import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vicinity",
  description: "Discover Toronto and GTA events near you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
