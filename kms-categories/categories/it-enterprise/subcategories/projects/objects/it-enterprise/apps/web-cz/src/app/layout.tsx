import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '../providers/QueryProvider'
import { ToastProvider, ErrorBoundary } from '@it-enterprise/ui'

const inter = Inter({ subsets: ['latin', 'cyrillic', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'IT Enterprise - Moderní řešení pro váš byznys',
  description: 'Komplexní software pro účetnictví, personální agendu a automatizaci procesů. Využijte sílu AI a moderních technologií.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <ErrorBoundary>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

