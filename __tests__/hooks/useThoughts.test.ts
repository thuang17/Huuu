import { thoughtsReducer } from '@/hooks/useThoughts'
import type { Thought, ThoughtsAction } from '@/lib/types'

const t1: Thought = { id: '1', timestamp: new Date().toISOString(), value: '想法一', readOnly: false }
const t2: Thought = { id: '2', timestamp: new Date().toISOString(), value: '想法二', readOnly: false }

describe('thoughtsReducer', () => {
  it('LOAD replaces state', () => {
    expect(thoughtsReducer([], { type: 'LOAD', thoughts: [t1] })).toEqual([t1])
  })

  it('ADD prepends thought', () => {
    const state = thoughtsReducer([t2], { type: 'ADD', thought: t1 })
    expect(state[0]).toEqual(t1)
    expect(state).toHaveLength(2)
  })

  it('REMOVE filters out thought by id', () => {
    expect(thoughtsReducer([t1, t2], { type: 'REMOVE', id: '1' })).toEqual([t2])
  })

  it('UPDATE changes value of matching thought', () => {
    const state = thoughtsReducer([t1], { type: 'UPDATE', id: '1', value: '新内容' })
    expect(state[0].value).toBe('新内容')
  })

  it('RETIRE sets readOnly to true', () => {
    const state = thoughtsReducer([t1], { type: 'RETIRE', id: '1' })
    expect(state[0].readOnly).toBe(true)
  })

  it('CLEAR returns empty array', () => {
    expect(thoughtsReducer([t1, t2], { type: 'CLEAR' })).toEqual([])
  })
})
