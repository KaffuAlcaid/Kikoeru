import { Dark } from 'quasar'

export const COLOR_SCHEME_KEY = 'kikoeru-color-scheme'
export const COLOR_SCHEME_EVENT = 'kikoeru-color-scheme-change'
const LEGACY_DARK_MODE_KEY = 'kikoeru-dark-mode'
export const COLOR_SCHEMES = {
  LIGHT: 'light',
  SYSTEM: 'system',
  DARK: 'dark',
}

export function readColorScheme () {
  const saved = window.localStorage.getItem(COLOR_SCHEME_KEY)
  if (Object.values(COLOR_SCHEMES).includes(saved)) return saved

  const legacy = window.localStorage.getItem(LEGACY_DARK_MODE_KEY)
  if (legacy === 'true') return COLOR_SCHEMES.DARK
  if (legacy === 'false') return COLOR_SCHEMES.LIGHT
  return COLOR_SCHEMES.SYSTEM
}

export function hasSavedColorScheme () {
  return Object.values(COLOR_SCHEMES).includes(window.localStorage.getItem(COLOR_SCHEME_KEY)) ||
    ['true', 'false'].includes(window.localStorage.getItem(LEGACY_DARK_MODE_KEY))
}

export function applyColorScheme (scheme, { persist = true } = {}) {
  const next = Object.values(COLOR_SCHEMES).includes(scheme) ? scheme : COLOR_SCHEMES.SYSTEM
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  Dark.set(next === COLOR_SCHEMES.DARK || (next === COLOR_SCHEMES.SYSTEM && prefersDark))
  if (persist) window.localStorage.setItem(COLOR_SCHEME_KEY, next)
  window.dispatchEvent(new CustomEvent(COLOR_SCHEME_EVENT, { detail: { scheme: next } }))
  return next
}
