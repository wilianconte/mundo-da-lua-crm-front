import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Mundo da Lua CRM",
  description: "Painel administrativo do Mundo da Lua CRM"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--color-foreground)] focus:shadow-[var(--shadow-soft)]"
          href="#main-content"
        >
          Pular para o conteudo principal
        </a>
        {children}
      </body>
    </html>
  );
}
