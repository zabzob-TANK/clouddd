import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'Zemzem Asfar',
  description: 'Gestion de la Omra',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // L'interface est en français et se lit de gauche à droite ; seules les
    // valeurs arabes sont isolées en droite-à-gauche, au niveau des composants.
    <html lang="fr" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Polices du fichier de référence ; à défaut, les polices système prennent le relais. */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
