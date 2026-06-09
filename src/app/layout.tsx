import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radar de Passagens',
  description: 'Buscador automatizado de passagens aereas baratas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
