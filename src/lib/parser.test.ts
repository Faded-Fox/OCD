import { describe, expect, it } from 'vitest'
import { parseImportText } from './parser'

describe('parseImportText — empty and unparseable input', () => {
  it('returns no sessions with a warning for empty input', () => {
    const result = parseImportText('   ')
    expect(result.sessions).toEqual([])
    expect(result.warnings).toContain('input was empty')
  })

  it('returns no sessions with a warning when no session boundaries can be found', () => {
    const result = parseImportText('just some unrelated chit-chat with no rung mentions at all')
    expect(result.sessions).toEqual([])
    expect(result.warnings.some((w) => w.includes('no session boundaries'))).toBe(true)
  })
})

describe('parseImportText — a well-formed labeled Session Log', () => {
  const text = `
Session Log

Date: 2026-01-15
Hierarchy: Contamination/Public Restrooms
Rung: 4
Rung description: Touch the restroom door handle without washing hands afterward
Target SUDs range: 2-5
Variation: rush hour
Exposure type: In-vivo
Planned duration: 20 min

Pre-exposure SUDs: 6
5 min: SUDs 8
10 min: SUDs 6
15 min: SUDs 4
End SUDs: 3

Compulsions targeted: hand washing, checking door handle
Compulsions resisted: hand washing
Techniques used: diaphragmatic breathing, urge surfing

Notes: Noticed the urge faded faster than last time.
`

  it('extracts exactly one session with no missing-field flags', () => {
    const result = parseImportText(text)
    expect(result.sessions).toHaveLength(1)
    const s = result.sessions[0]
    expect(s.flags).toEqual([])
  })

  it('extracts the core fields correctly', () => {
    const s = parseImportText(text).sessions[0]
    expect(s.date).toBe('2026-01-15')
    expect(s.hierarchy).toBe('Contamination/Public Restrooms')
    expect(s.rung).toBe(4)
    expect(s.target_suds_range).toEqual([2, 5])
    expect(s.variation).toBe('rush hour')
    expect(s.exposure_type).toBe('in-vivo')
    expect(s.planned_duration_minutes).toBe(20)
  })

  it('extracts the SUDs readings in order, plus peak and end', () => {
    const s = parseImportText(text).sessions[0]
    expect(s.readings.map((r) => r.suds)).toEqual([6, 8, 6, 4, 3])
    expect(s.peak_suds).toBe(8)
    expect(s.end_suds).toBe(3)
  })

  it('extracts compulsions, resistance, and techniques', () => {
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_targeted).toEqual(['hand washing', 'checking door handle'])
    expect(s.techniques_used).toEqual(expect.arrayContaining(['diaphragmatic breathing', 'urge surfing']))
  })

  it('builds a session_id from the date and rung', () => {
    const s = parseImportText(text).sessions[0]
    expect(s.session_id).toBe('2026-01-15-rung4')
  })
})

describe('parseImportText — missing fields are flagged, not guessed', () => {
  it('flags a missing date, hierarchy, rung, and readings independently', () => {
    const text = `
Session Log
Notes: forgot to log the actual exposure details
`
    const s = parseImportText(text).sessions[0]
    expect(s.date).toBe('')
    expect(s.hierarchy).toBe('')
    expect(s.rung).toBeNull()
    expect(s.readings).toEqual([])
    expect(s.flags).toEqual(
      expect.arrayContaining([
        'date not found — please set manually',
        'hierarchy not found — please set manually',
        'rung number not found — please set manually',
        'no SUDs readings found — please add manually',
      ]),
    )
  })

  it('falls back to an undated/no-rung session_id when both are missing', () => {
    const text = `Session Log\nNotes: nothing else logged`
    const s = parseImportText(text).sessions[0]
    expect(s.session_id).toBe('undated-1-rungNA')
  })
})

describe('parseImportText — compulsion resistance inference', () => {
  it('infers full resistance from an explicit "fully resisted" phrase', () => {
    const text = `Session Log\nRung: 2\nThe exposure was fully resisted, no compulsions performed.`
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_resisted).toBe(true)
  })

  it('infers partial resistance from an explicit "partially resisted" phrase', () => {
    const text = `Session Log\nRung: 2\nOverall this was partially resisted today.`
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_resisted).toBe(false)
  })

  it('infers partial resistance when a "Compulsions completed" list is present', () => {
    const text = `Session Log\nRung: 2\nCompulsions completed: checked the lock twice`
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_resisted).toBe(false)
  })

  it('infers full resistance when only "Compulsions targeted" is present with no completions', () => {
    const text = `Session Log\nRung: 2\nCompulsions targeted: checking the lock`
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_resisted).toBe(true)
  })

  it('flags resistance status as unknown when nothing indicates it either way', () => {
    const text = `Session Log\nRung: 2\nJust a plain description with no compulsion info.`
    const s = parseImportText(text).sessions[0]
    expect(s.compulsions_resisted).toBeNull()
    expect(s.flags).toContain('compulsion resistance status not found — review manually')
  })
})

describe('parseImportText — SUDs reading formats', () => {
  it('parses clock-time readings', () => {
    const text = `Session Log\nRung: 1\n10:42am: SUDs 6\n10:55am: SUDs 3`
    const s = parseImportText(text).sessions[0]
    expect(s.readings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ suds: 6 }),
        expect.objectContaining({ suds: 3 }),
      ]),
    )
  })

  it('uses an explicit "Peak SUDs" label over the computed max', () => {
    const text = `Session Log\nRung: 1\nPre-exposure SUDs: 4\n5 min: SUDs 7\nPeak SUDs: 9`
    const s = parseImportText(text).sessions[0]
    expect(s.peak_suds).toBe(9)
  })
})

describe('parseImportText — multiple sessions and JSON conversation exports', () => {
  it('extracts multiple labeled sessions from one transcript', () => {
    const text = `
Session Log
Date: 2026-01-01
Rung: 1
Pre-exposure SUDs: 5

Session Log
Date: 2026-01-08
Rung: 2
Pre-exposure SUDs: 6
`
    const result = parseImportText(text)
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions.map((s) => s.date)).toEqual(['2026-01-01', '2026-01-08'])
    expect(result.sessions.map((s) => s.rung)).toEqual([1, 2])
  })

  it('flattens a Claude.ai conversation export and parses the session log inside it', () => {
    const exportJson = JSON.stringify({
      name: 'ERP check-in',
      chat_messages: [
        {
          sender: 'human',
          text: 'Session Log\nDate: 2026-02-01\nRung: 3\nPre-exposure SUDs: 5\nEnd SUDs: 2',
        },
      ],
    })
    const result = parseImportText(exportJson)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].date).toBe('2026-02-01')
    expect(result.sessions[0].rung).toBe(3)
  })

  it('falls back to raw-text parsing with a warning when JSON has no recognizable messages', () => {
    const result = parseImportText(JSON.stringify({ foo: 'bar' }))
    expect(result.warnings.some((w) => w.includes('no recognizable conversation messages'))).toBe(true)
  })

  it('falls back to raw-text parsing with a warning when JSON-looking input fails to parse', () => {
    // Must start with "{" and end with "}" to be treated as JSON at all (looksLikeJson),
    // while still being invalid JSON in between.
    const result = parseImportText('{not actually valid json}')
    expect(result.warnings.some((w) => w.includes('failed to parse'))).toBe(true)
  })
})

describe('parseImportText — exposure type detection', () => {
  it('detects imaginal from an unlabeled mention', () => {
    const text = `Session Log\nDate: 2026-02-01\nHierarchy: Harm\nRung: 2\nThis was an imaginal exposure — I imagined the intrusive scenario in detail.\nPre-exposure SUDs: 5\nEnd SUDs: 3`
    const s = parseImportText(text).sessions[0]
    expect(s.exposure_type).toBe('imaginal')
  })

  it('detects interoceptive from an unlabeled mention', () => {
    const text = `Session Log\nDate: 2026-02-01\nHierarchy: Panic\nRung: 1\nRan an interoceptive exposure — spinning in a chair to bring on dizziness.\nPre-exposure SUDs: 5\nEnd SUDs: 3`
    const s = parseImportText(text).sessions[0]
    expect(s.exposure_type).toBe('interoceptive')
  })

  it('normalizes "in vivo" (no hyphen) the same as "in-vivo"', () => {
    const text = `Session Log\nDate: 2026-02-01\nHierarchy: Contamination\nRung: 2\nExposure type: in vivo\nPre-exposure SUDs: 5\nEnd SUDs: 3`
    const s = parseImportText(text).sessions[0]
    expect(s.exposure_type).toBe('in-vivo')
  })

  it('leaves exposure_type null when nothing indicates a type', () => {
    const text = `Session Log\nDate: 2026-02-01\nHierarchy: Contamination\nRung: 2\nPre-exposure SUDs: 5\nEnd SUDs: 3`
    const s = parseImportText(text).sessions[0]
    expect(s.exposure_type).toBeNull()
  })
})

describe('parseImportText — unlabeled fallback extraction', () => {
  it('extracts a session from raw dialogue with a rung mention and flags it for review', () => {
    const text = `Human: Let's try Contamination, rung 3 today.\nClaude: Sounds good, how did it go?`
    const result = parseImportText(text)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].rung).toBe(3)
    expect(result.sessions[0].flags).toContain('no labeled session-log block found — extracted from raw dialogue')
    expect(result.warnings.some((w) => w.includes('fell back to extracting'))).toBe(true)
  })
})
