import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Orbitron } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Brand typography per the CIIT brand doc (see PROJECT-NOTES.md):
// Montserrat for body text, Orbitron for the brand wordmark/display.
// Proxima Nova is logo-only and ships flattened in the logo images.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S.P.A.R.K.",
  description: "Support Platform for Assistance, Requests & Knowledge — CIIT IT ticketing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${orbitron.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
