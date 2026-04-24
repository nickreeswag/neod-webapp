import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The NEOD | Near-Earth Object Dashboard",
  description: "Real-time dashboard tracking Near-Earth Objects using the NASA REST API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased dark`}>
      <body className="min-h-full bg-aura-bg text-aura-text font-sans">
        {children}
      </body>
    </html>
  );
}
