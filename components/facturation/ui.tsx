'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

/**
 * Le prototype décrit tous ses styles sous forme de chaînes CSS inline.
 * `css()` les convertit en objets de style React, ce qui permet de recopier
 * les déclarations du prototype telles quelles, sans les réécrire.
 */
const cache = new Map<string, CSSProperties>()

export function css(decl?: string | null): CSSProperties {
  if (!decl) return {}
  const hit = cache.get(decl)
  if (hit) return hit
  const style: Record<string, string> = {}
  for (const part of decl.split(';')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    const prop = part.slice(0, i).trim()
    const value = part.slice(i + 1).trim()
    if (!prop || !value) continue
    if (prop.startsWith('--')) {
      style[prop] = value
      continue
    }
    const key = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    style[key] = value
  }
  const frozen = style as CSSProperties
  cache.set(decl, frozen)
  return frozen
}

/** Équivalent de l'attribut `style-hover` du prototype. */
function useHoverStyle(base: string, hover?: string) {
  const [over, setOver] = useState(false)
  const style = useMemo(() => css(over && hover ? base + ';' + hover : base), [base, hover, over])
  return {
    style,
    onMouseEnter: () => setOver(true),
    onMouseLeave: () => setOver(false),
  }
}

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'> & {
  s?: string
  sh?: string
}

export function Btn({ s = '', sh, children, ...rest }: ButtonProps) {
  const hover = useHoverStyle(s, sh)
  return (
    <button type="button" {...hover} {...rest}>
      {children}
    </button>
  )
}

type DivProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  s?: string
  sh?: string
}

export function Box({ s = '', sh, children, ...rest }: DivProps) {
  const hover = useHoverStyle(s, sh)
  return (
    <div {...hover} {...rest}>
      {children}
    </div>
  )
}

type RowProps = Omit<React.HTMLAttributes<HTMLTableRowElement>, 'style'> & {
  s?: string
  sh?: string
}

export function Tr({ s = '', sh, children, ...rest }: RowProps) {
  const hover = useHoverStyle(s, sh)
  return (
    <tr {...hover} {...rest}>
      {children}
    </tr>
  )
}

/** Le logo « théière / dallah » repris à l'identique du prototype. */
export function Logo({ size, stroke = '#fff', width = '1.7' }: { size: number; stroke?: string; width?: string }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M10 2h4M12 2v3" />
      <path d="M9 5h6a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5z" />
      <path d="M4.5 14c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 3.5 1.4" />
    </svg>
  )
}

export function Icon({ size, children, width = '2' }: { size: number; children: ReactNode; width?: string }) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}
