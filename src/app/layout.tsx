import type { Metadata } from "next";
import { Inter, Zen_Dots } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const zenDots = Zen_Dots({
  variable: "--font-zen-dots",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "StoryFoundry - Where Stories Come to Life",
  description: "The collaborative platform for writers, directors, and producers. Create, protect, and pitch your stories with AI-powered tools and industry-grade IP protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${zenDots.variable} antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
