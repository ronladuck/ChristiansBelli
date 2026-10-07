import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { HistoryProvider } from "@/lib/store";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Menu — Tell us what you want. We'll narrow it down to three.",
  description:
    "Describe what you're craving and get exactly three restaurant recommendations: your pick, the best overall, and a wild card.",
  applicationName: "Menu",
};

export const viewport: Viewport = {
  themeColor: "#113b2b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <HistoryProvider>{children}</HistoryProvider>
      </body>
    </html>
  );
}
