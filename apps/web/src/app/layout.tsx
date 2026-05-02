import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { BottomNav } from '@/components/bottom-nav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '家庭麻将记分',
  description: '家庭麻将游戏记分应用',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <main className="pb-16">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
