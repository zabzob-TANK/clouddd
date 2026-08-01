import type { Metadata } from 'next'

import { ApplicationFacturation } from '@/modules/facturation/ui/application'

import {
  ajouterVersement,
  annulerRecu,
  chargerEtat,
  connecter,
  creerRecu,
  deconnecter,
  acquitterAnomalies,
  ajouterImageDernierVersement,
  ajouterImageOperation,
  enregistrerImpression,
  enregistrerImpressionFinance,
  journalFinancier,
  modifierRecu,
  registreBancaire,
  suiviJournalier,
  supprimerImageOperation,
} from './actions'

export const metadata: Metadata = {
  title: 'Zemzem Asfar — Facturation et registre des paiements',
  description:
    'Reçus, versements, opérations partagées et journal des paiements pour la gestion de la Omra.',
}

/** Les données de démonstration vivent en mémoire : rien ne doit être mis en cache. */
export const dynamic = 'force-dynamic'

export default async function PageFacturation() {
  const etatInitial = await chargerEtat()

  return (
    <ApplicationFacturation
      etatInitial={etatInitial}
      comptesEssai={['3 / 3', 'samir / 1234']}
      actions={{
        connecter,
        deconnecter,
        recharger: chargerEtat,
        creerRecu,
        ajouterVersement,
        annulerRecu,
        modifierRecu,
        enregistrerImpression,
        journalFinancier,
        enregistrerImpressionFinance,
        acquitterAnomalies,
        suiviJournalier,
        registreBancaire,
        ajouterImageOperation,
        ajouterImageDernierVersement,
        supprimerImageOperation,
      }}
    />
  )
}
