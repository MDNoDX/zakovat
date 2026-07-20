import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HtmlLangSync } from "@/components/HtmlLangSync";
import { CrossTabSync } from "@/components/CrossTabSync";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Zakovat — Prezentatsiya platformasi",
  description:
    "Zakovat (viktorina) o'yinlarini loyihalash va taqdim etish uchun minimalist, professional platforma.",
};

// Applied before hydration so there's no flash of the wrong theme on load.
const THEME_INIT_SCRIPT = `(function(){try{var t=window.localStorage.getItem('zakovat-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <HtmlLangSync />
        <CrossTabSync />
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
