import type { Metadata } from 'next';
import './globals.css';
import { ThemeLanguageProvider } from '@/context/ThemeLanguageContext';

export const metadata: Metadata = {
  title: 'Grok Cartoon Studio — AI Cartoon Creator',
  description: 'AI Cartoon Studio powered by xAI Grok Imagine Video 1.5 Lite and Grok TTS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-[#f3f4f6] transition-colors duration-150">
        <ThemeLanguageProvider>{children}</ThemeLanguageProvider>
      </body>
    </html>
  );
}
