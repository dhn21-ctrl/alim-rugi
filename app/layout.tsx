import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alim Rugi | Efficiency in Every Purchase',
  description: 'Next generation inventory management tools for SME',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: 'Inter, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}