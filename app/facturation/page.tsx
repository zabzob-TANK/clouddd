import type { Metadata } from 'next'

import { ZemzemApp } from '@/components/facturation/ZemzemApp'

export const metadata: Metadata = {
  title: 'زمزم أسفار — الفوترة وربط جواز السفر',
  description: 'Réplique du prototype de facturation Zemzem Asfar : reçus, caisse et scan du passeport.',
}

export default function FacturationPage() {
  return (
    <>
      {/* Polices du prototype ; en cas d'indisponibilité, les polices système
          arabes prennent le relais comme dans le fichier d'origine. */}
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <ZemzemApp />
    </>
  )
}
