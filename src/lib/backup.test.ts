import { describe, expect, it } from 'vitest'
import { countBackupEntries, describeBackupCounts, looksLikeBackup, parseBackup, type BackupCounts } from './backup'

describe('looksLikeBackup', () => {
  it('rejects anything that does not start with "{"', () => {
    expect(looksLikeBackup('[1, 2, 3]')).toBe(false)
    expect(looksLikeBackup('Session Log\nRung: 2')).toBe(false)
    expect(looksLikeBackup('')).toBe(false)
  })

  it('rejects text that looks like JSON but fails to parse', () => {
    expect(looksLikeBackup('{not valid json')).toBe(false)
  })

  it('rejects a valid JSON object with none of the expected backup keys', () => {
    expect(looksLikeBackup('{"foo": "bar"}')).toBe(false)
  })

  it('accepts an object with any recognized array field, even if empty', () => {
    expect(looksLikeBackup('{"sessions": []}')).toBe(true)
    expect(looksLikeBackup('{"journalEntries": []}')).toBe(true)
    expect(looksLikeBackup('{"focusPlans": []}')).toBe(true)
    expect(looksLikeBackup('{"fearLadders": []}')).toBe(true)
  })

  it('accepts an object with a truthy flareGuide but rejects a null one with nothing else', () => {
    expect(looksLikeBackup('{"flareGuide": {"introNote": "hi"}}')).toBe(true)
    expect(looksLikeBackup('{"flareGuide": null}')).toBe(false)
  })

  it('tolerates surrounding whitespace', () => {
    expect(looksLikeBackup('  \n {"sessions": []}\n  ')).toBe(true)
  })
})

describe('countBackupEntries', () => {
  it('counts each category independently', () => {
    const raw = JSON.stringify({
      sessions: [{}, {}],
      journalEntries: [{}],
      focusPlans: [{}, {}, {}],
      fearLadders: [],
      flareGuide: { introNote: 'hi' },
    })
    expect(countBackupEntries(raw)).toEqual({
      sessions: 2,
      journalEntries: 1,
      focusPlans: 3,
      fearLadders: 0,
      flareGuide: 1,
    })
  })

  it('treats missing fields as zero', () => {
    expect(countBackupEntries('{}')).toEqual({
      sessions: 0,
      journalEntries: 0,
      focusPlans: 0,
      fearLadders: 0,
      flareGuide: 0,
    })
  })

  it('treats an explicit null flareGuide as zero, not one', () => {
    expect(countBackupEntries('{"flareGuide": null}').flareGuide).toBe(0)
  })

  it('ignores a field that is present but not actually an array', () => {
    expect(countBackupEntries('{"sessions": "oops"}').sessions).toBe(0)
  })

  it('returns all-zero counts instead of throwing on invalid JSON', () => {
    expect(countBackupEntries('not json at all')).toEqual({
      sessions: 0,
      journalEntries: 0,
      focusPlans: 0,
      fearLadders: 0,
      flareGuide: 0,
    })
  })
})

describe('describeBackupCounts', () => {
  const zero: BackupCounts = { sessions: 0, journalEntries: 0, focusPlans: 0, fearLadders: 0, flareGuide: 0 }

  it('says "nothing" when every count is zero', () => {
    expect(describeBackupCounts(zero)).toBe('nothing')
  })

  it('uses singular vs. plural forms correctly, including the irregular "entry/entries"', () => {
    expect(describeBackupCounts({ ...zero, sessions: 1 })).toBe('1 session')
    expect(describeBackupCounts({ ...zero, sessions: 2 })).toBe('2 sessions')
    expect(describeBackupCounts({ ...zero, journalEntries: 1 })).toBe('1 journal entry')
    expect(describeBackupCounts({ ...zero, journalEntries: 2 })).toBe('2 journal entries')
  })

  it('describes the flare guide as "a flare guide" regardless of its count', () => {
    expect(describeBackupCounts({ ...zero, flareGuide: 1 })).toBe('a flare guide')
  })

  it('joins exactly two parts with "and" and no comma', () => {
    expect(describeBackupCounts({ ...zero, sessions: 1, focusPlans: 1 })).toBe('1 session and 1 focus plan')
  })

  it('joins three or more parts with an Oxford comma before "and"', () => {
    expect(describeBackupCounts({ ...zero, sessions: 1, journalEntries: 1, flareGuide: 1 })).toBe(
      '1 session, 1 journal entry, and a flare guide',
    )
  })

  it('always orders parts sessions, journal entries, focus plans, fear ladders, flare guide', () => {
    expect(describeBackupCounts({ sessions: 1, journalEntries: 0, focusPlans: 1, fearLadders: 1, flareGuide: 1 })).toBe(
      '1 session, 1 focus plan, 1 fear ladder, and a flare guide',
    )
  })
})

describe('parseBackup', () => {
  const baseSession = {
    id: 'id-1',
    session_id: '2026-01-01-rung1',
    date: '2026-01-01',
    hierarchy: 'Contamination',
    rung: 1,
    rung_description: '',
    target_suds_range: null,
    variation: null,
    exposure_type: null,
    planned_duration_minutes: null,
    readings: [],
    peak_suds: null,
    end_suds: null,
    compulsions_targeted: [],
    compulsions_completed: [],
    compulsions_resisted: null,
    techniques_used: [],
    notes: '',
    flags: [],
    source_excerpt: '',
  }

  it('decodes a session photo data URL back into a Blob', async () => {
    // "hello" base64-encoded, as a fake photo.
    const raw = JSON.stringify({
      sessions: [{ ...baseSession, photo: 'data:image/png;base64,aGVsbG8=' }],
    })
    const result = await parseBackup(raw)
    expect(result.sessions).toHaveLength(1)
    const photo = result.sessions[0].photo
    expect(photo).toBeInstanceOf(Blob)
    expect(photo!.type).toBe('image/png')
    expect(photo!.size).toBe(5)
  })

  it('leaves a session with no photo as null, untouched', async () => {
    const raw = JSON.stringify({ sessions: [{ ...baseSession, photo: null }] })
    const result = await parseBackup(raw)
    expect(result.sessions[0].photo).toBeNull()
  })

  it('preserves every other session field unchanged', async () => {
    const raw = JSON.stringify({
      sessions: [{ ...baseSession, hierarchy: 'Harm', rung: 7, notes: 'a note', photo: null }],
    })
    const result = await parseBackup(raw)
    expect(result.sessions[0]).toMatchObject({ hierarchy: 'Harm', rung: 7, notes: 'a note' })
  })

  it('decodes multiple session photos independently without cross-contamination', async () => {
    const raw = JSON.stringify({
      sessions: [
        { ...baseSession, id: 'a', photo: 'data:text/plain;base64,YQ==' }, // "a"
        { ...baseSession, id: 'b', photo: 'data:text/plain;base64,YmI=' }, // "bb"
      ],
    })
    const result = await parseBackup(raw)
    const byId = Object.fromEntries(result.sessions.map((s) => [s.id, s.photo as Blob]))
    expect(byId.a.size).toBe(1)
    expect(byId.b.size).toBe(2)
  })

  it('defaults every other top-level field to empty/null when absent', async () => {
    const result = await parseBackup('{}')
    expect(result).toEqual({
      sessions: [],
      journalEntries: [],
      focusPlans: [],
      fearLadders: [],
      flareGuide: null,
    })
  })

  it('passes through journalEntries, focusPlans, fearLadders, and flareGuide untouched', async () => {
    const raw = JSON.stringify({
      journalEntries: [{ id: 'j1' }],
      focusPlans: [{ id: 'f1' }],
      fearLadders: [{ id: 'l1' }],
      flareGuide: { introNote: 'hi' },
    })
    const result = await parseBackup(raw)
    expect(result.journalEntries).toEqual([{ id: 'j1' }])
    expect(result.focusPlans).toEqual([{ id: 'f1' }])
    expect(result.fearLadders).toEqual([{ id: 'l1' }])
    expect(result.flareGuide).toEqual({ introNote: 'hi' })
  })

  it('rejects on invalid JSON rather than silently returning an empty backup', async () => {
    await expect(parseBackup('not json at all')).rejects.toThrow()
  })
})
