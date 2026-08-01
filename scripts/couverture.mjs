#!/usr/bin/env node
/**
 * Contrôle de couverture du registre des règles.
 *
 * Lit `docs/facturation/inventaire.md`, puis vérifie que chaque identifiant
 * appartenant à un lot déjà livré apparaît :
 *   - dans le code du module (`modules/facturation/**`, hors fichiers de test) ;
 *   - dans au moins un fichier de test.
 *
 * Sort en erreur si un identifiant d'un lot livré est absent de l'un des deux.
 * Les identifiants des lots à venir sont seulement rapportés.
 *
 * Usage : npm run couverture
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RACINE = process.cwd()
const REGISTRE = join(RACINE, 'docs/facturation/inventaire.md')
const MODULE = join(RACINE, 'modules/facturation')

/** Lots dont la livraison est terminée. À compléter au fil des lots. */
const LOTS_LIVRES = new Set(['L0', 'L1', 'L2', 'L3', 'L4'])

const ID_VALIDE = /^[CUR]-\d{2}$/

function lireRegistre() {
  const contenu = readFileSync(REGISTRE, 'utf8')
  const entrees = []
  for (const ligne of contenu.split('\n')) {
    if (!ligne.startsWith('|')) continue
    const cellules = ligne
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())
    if (cellules.length < 4) continue
    const [id, element, lot, statut] = cellules
    if (!ID_VALIDE.test(id)) continue
    entrees.push({ id, element, lot, statut })
  }
  return entrees
}

function fichiers(dossier, acc = []) {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) fichiers(chemin, acc)
    else if (/\.(ts|tsx)$/.test(nom)) acc.push(chemin)
  }
  return acc
}

function indexer() {
  const code = new Map()
  const tests = new Map()
  for (const chemin of fichiers(MODULE)) {
    const contenu = readFileSync(chemin, 'utf8')
    const estTest = /\.test\.tsx?$/.test(chemin)
    const cible = estTest ? tests : code
    for (const trouve of contenu.matchAll(/\b([CUR]-\d{2})\b/g)) {
      const id = trouve[1]
      if (!cible.has(id)) cible.set(id, new Set())
      cible.get(id).add(relative(RACINE, chemin))
    }
  }
  return { code, tests }
}

function principal() {
  const entrees = lireRegistre()
  const { code, tests } = indexer()

  const manquants = []
  const parLot = new Map()

  for (const entree of entrees) {
    const seau = parLot.get(entree.lot) ?? { total: 0, couverts: 0 }
    seau.total += 1

    const dansCode = code.has(entree.id)
    const dansTests = tests.has(entree.id)
    if (dansCode && dansTests) seau.couverts += 1

    parLot.set(entree.lot, seau)

    if (LOTS_LIVRES.has(entree.lot) && !(dansCode && dansTests)) {
      manquants.push({
        id: entree.id,
        element: entree.element,
        code: dansCode,
        tests: dansTests,
      })
    }
  }

  console.log('Couverture du registre — docs/facturation/inventaire.md\n')
  const lots = [...parLot.keys()].sort()
  for (const lot of lots) {
    const { total, couverts } = parLot.get(lot)
    const etat = LOTS_LIVRES.has(lot) ? 'livré' : 'prévu'
    console.log(
      `  ${lot} (${etat.padEnd(5)}) : ${String(couverts).padStart(3)} / ${String(total).padStart(3)} identifiants couverts`,
    )
  }

  const totalGeneral = entrees.length
  const couvertsGeneral = [...parLot.values()].reduce((s, l) => s + l.couverts, 0)
  console.log(`\n  Total          : ${couvertsGeneral} / ${totalGeneral}\n`)

  if (manquants.length) {
    console.error('Identifiants de lots livrés sans couverture complète :\n')
    for (const m of manquants) {
      const details = [!m.code && 'absent du code', !m.tests && 'absent des tests']
        .filter(Boolean)
        .join(', ')
      console.error(`  ${m.id} — ${m.element}\n      ${details}`)
    }
    console.error('')
    process.exit(1)
  }

  console.log('Tous les identifiants des lots livrés sont couverts.')
}

principal()
