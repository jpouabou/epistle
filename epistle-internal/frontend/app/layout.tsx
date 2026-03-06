import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Epistle Internal',
  description: 'Internal admin tool for Epistle scriptures',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-surface text-zinc-200 font-sans antialiased">
        <header className="sticky top-0 z-10 border-b border-white/5 bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-baseline gap-2">
              <Link
                href="/scriptures"
                className="text-lg font-semibold text-white transition hover:text-zinc-300"
              >
                Epistle
              </Link>
              <span className="text-xs text-zinc-500">Internal</span>
            </div>
            <nav className="flex items-center gap-1">
              <a
                href="https://www.joinepistle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
              >
                joinepistle.com
              </a>
              <Link
                href="/scriptures"
                className="rounded-md px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Scriptures
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
