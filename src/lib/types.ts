export interface Thought {
  id: string
  timestamp: string // ISO 8601
  value: string
  readOnly: boolean
}

export type Theme = 'dark' | 'light' | 'system'

export type ThoughtsAction =
  | { type: 'ADD'; thought: Thought }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE'; id: string; value: string }
  | { type: 'RETIRE'; id: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; thoughts: Thought[] }
