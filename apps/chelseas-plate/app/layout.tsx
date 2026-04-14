import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chelsea's Plate",
  description: "A simple allergy-aware restaurant menu finder for Canadian fast food.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
