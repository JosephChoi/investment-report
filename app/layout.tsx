import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/ui/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advisor Report - 투자자문 고객관리 서비스",
  description: "투자자문 고객을 위한 포트폴리오 관리 및 투자 정보 서비스",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/ar-logo-full.png', type: 'image/png', sizes: '32x32' }
    ],
    shortcut: { url: '/ar-logo-full.png', type: 'image/png' },
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    other: [
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="bg-white">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen w-full`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
