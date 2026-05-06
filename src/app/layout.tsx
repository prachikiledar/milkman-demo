import type { Metadata } from "next";
import {
  Noto_Sans,
  Noto_Sans_Mono,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

// Primary UI font — covers Latin + Devanagari.
const notoSans = Noto_Sans({
  variable: "--font-sans",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700", "800"],
});

// Gurmukhi (ਪੰਜਾਬੀ) glyph support. Loaded via a separate CSS variable
// that we include in the font stack so Gurmukhi characters always have
// a matching glyph.
const notoSansGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-gurmukhi",
  subsets: ["gurmukhi", "latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Milkman",
  description: "Milk delivery management app for Indian sellers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${notoSans.variable} ${notoSansGurmukhi.variable} ${notoSansMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
