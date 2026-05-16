import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_SC, Oswald } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-noto',
})
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-oswald',
})

export const metadata: Metadata = {
  title: 'Huuu — Write to breathe.',
  description: '通过写作，清空思绪。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Huuu',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

const THEME_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('__HUUU_THEME__') || 'dark';
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${notoSansSC.variable} ${oswald.variable} font-sans`}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
