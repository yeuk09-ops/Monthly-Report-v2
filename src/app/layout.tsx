import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FNF 26.2월 BS/CF 리포트',
  description: 'F&F · F&F Holdings 재무상태표 · 자금계획 통합 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20`}>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 text-slate-300 py-3 text-center text-xs">
          FNF 26.2월 BS/CF 리포트 | F&F · F&F Holdings
        </footer>
      </body>
    </html>
  );
}
