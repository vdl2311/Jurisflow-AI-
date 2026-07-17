import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JusFlow — Sistema Jurídico Inteligente",
  description: "Plataforma SaaS para escritórios de advocacia com IA, gestão de processos, prazos, tarefas e financeiro.",
  keywords: ["advocacia", "jurídico", "SaaS", "processos", "prazos", "IA jurídica"],
  authors: [{ name: "JusFlow" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        
        {/* Aggressively hide Next.js dev indicators and development overlays */}
        <script
          dangerouslySetInnerHTML={{
            __html: "(function() {\n" +
              "  const style = document.createElement('style');\n" +
              "  style.textContent = '\\n" +
              "    next-dev-indicator, next-route-announcer, .nextjs-portal, #next-route-announcer, .nextjs-static-indicator, [data-nextjs-toast-container], [data-nextjs-dialog-overlay], [id^=\"next-\"], [class^=\"nextjs-\"], nextjs-feedback, iframe[src*=\"feedback\"] {\\n" +
              "      display: none !important;\\n" +
              "      visibility: hidden !important;\\n" +
              "      opacity: 0 !important;\\n" +
              "      pointer-events: none !important;\\n" +
              "      width: 0 !important;\\n" +
              "      height: 0 !important;\\n" +
              "    }\\n" +
              "  ';\n" +
              "  document.head.appendChild(style);\n" +
              "  function hideIndicators() {\n" +
              "    const tags = ['next-dev-indicator', 'nextjs-portal', 'next-route-announcer', 'nextjs-feedback'];\n" +
              "    tags.forEach(tag => {\n" +
              "      const el = document.querySelector(tag);\n" +
              "      if (el) {\n" +
              "        el.style.setProperty('display', 'none', 'important');\n" +
              "        el.style.setProperty('visibility', 'hidden', 'important');\n" +
              "        el.style.setProperty('opacity', '0', 'important');\n" +
              "        el.style.setProperty('width', '0', 'important');\n" +
              "        el.style.setProperty('height', '0', 'important');\n" +
              "        el.style.setProperty('pointer-events', 'none', 'important');\n" +
              "        try { el.remove(); } catch(e) {}\n" +
              "      }\n" +
              "    });\n" +
              "  }\n" +
              "  hideIndicators();\n" +
              "  if (typeof window !== 'undefined') {\n" +
              "    const observer = new MutationObserver(hideIndicators);\n" +
              "    observer.observe(document.documentElement, { childList: true, subtree: true });\n" +
              "    setInterval(hideIndicators, 1000);\n" +
              "  }\n" +
              "})();"
          }}
        />
      </body>
    </html>
  );
}
