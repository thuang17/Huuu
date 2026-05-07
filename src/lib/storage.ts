import type { Thought } from './types'

const THOUGHTS_KEY = '__HUUU_THOUGHTS__'
const DRAFT_KEY = '__HUUU_DRAFT__'
const ONBOARDED_KEY = '__HUUU_HAS_ONBOARDED__'

export function getThoughts(): Thought[] {
  try {
    const raw = localStorage.getItem(THOUGHTS_KEY)
    return raw ? (JSON.parse(raw) as Thought[]) : []
  } catch {
    return []
  }
}

export function saveThoughts(thoughts: Thought[]): void {
  localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts))
}

export function getDraft(): string {
  return localStorage.getItem(DRAFT_KEY) ?? ''
}

export function saveDraft(draft: string): void {
  localStorage.setItem(DRAFT_KEY, draft)
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export function isOnboarded(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === 'true'
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, 'true')
}

export function getTheme(): string {
  return localStorage.getItem('theme') ?? 'dark'
}

export function saveTheme(theme: string): void {
  localStorage.setItem('theme', theme)
}
