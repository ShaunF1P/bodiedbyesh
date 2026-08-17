import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BODIED BY ESH | High-Performance Body Recomposition",
  description:
    "Elite science-based body recomposition coaching and fluidly adaptive fitness & nutrition architectures. Choose between local South Florida Park-to-Peak coaching or our Executive Concierge program.",
  appleWebApp: {
    capable: true,
    title: "Bodied by Esh",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0D0F12",
};

import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* PWA / Mobile Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* Prevent text size adjustment on orientation change */}
        <meta name="x-ua-compatible" content="IE=edge" />
        {/* Prevent flash of wrong theme (FOWT) — runs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||(t==null&&window.matchMedia('(prefers-color-scheme:light)').matches)){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cyber-slate text-ice-white font-sans selection:bg-accent-lime selection:text-cyber-slate">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
