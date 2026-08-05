import { setCssVar } from 'quasar'

export const DEFAULT_ACCENT_COLOR = '#1976D2'
export const ACCENT_COLOR_KEY = 'kikoeru-accent-color'
export const ACCENT_COLOR_EVENT = 'kikoeru-accent-color-change'
const RGB_HEX_PATTERN = /^#?[0-9a-f]{6}$/i
let activeAccentColor = DEFAULT_ACCENT_COLOR

export function normalizeAccentColor (value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!RGB_HEX_PATTERN.test(trimmed)) return null
  return `#${trimmed.replace(/^#/, '').toUpperCase()}`
}

export function readAccentColor () {
  return normalizeAccentColor(window.localStorage.getItem(ACCENT_COLOR_KEY)) || activeAccentColor
}

export function hasSavedAccentColor () {
  return normalizeAccentColor(window.localStorage.getItem(ACCENT_COLOR_KEY)) !== null
}

export function applyAccentColor (value, { persist = true } = {}) {
  const next = normalizeAccentColor(value) || DEFAULT_ACCENT_COLOR
  const hex = next.slice(1)
  const rgb = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16)).join(', ')

  activeAccentColor = next
  setCssVar('primary', next)
  setCssVar('accent', next)
  document.documentElement.style.setProperty('--kikoeru-accent-rgb', rgb)
  if (persist) window.localStorage.setItem(ACCENT_COLOR_KEY, next)
  window.dispatchEvent(new CustomEvent(ACCENT_COLOR_EVENT, { detail: { color: next, persist } }))
  return next
}
