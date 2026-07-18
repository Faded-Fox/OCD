import type { Session, SudsReading } from './types'

export interface ParseResult {
  sessions: Session[]
  warnings: string[]
}

const KNOWN_TECHNIQUES = [
  'defusion',
  'maybe/maybe not',
  'maybe / maybe not',
  'breathing',
  'diaphragmatic breathing',
  'box breathing',
  'distraction',
  'naming the thought as ocd',
  'naming it as ocd',
  'urge surfing',
  'opposite action',
  'self-compassion',
  'grounding',
  'mindfulness',
  'acceptance',
  'sitting with uncertainty',
  'labeling',
  'cognitive defusion',
  'thanking the mind',
]

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function looksLikeJson(s: string): boolean {
  return (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))
}

/** Best-effort flatten of a Claude.ai conversation export into a plain annotated transcript. */
function flattenClaudeExport(data: unknown): string {
  const parts: string[] = []

  const messageText = (msg: any): string => {
    if (typeof msg?.text === 'string') return msg.text
    if (Array.isArray(msg?.content)) {
      return msg.content
        .map((c: any) => (typeof c?.text === 'string' ? c.text : ''))
        .filter(Boolean)
        .join('\n')
    }
    return ''
  }

  const flattenConversation = (conv: any) => {
    if (conv?.name) parts.push(`\n### Conversation: ${conv.name}\n`)
    const messages = conv?.chat_messages ?? conv?.messages
    if (!Array.isArray(messages)) return
    for (const msg of messages) {
      const sender = msg?.sender === 'assistant' ? 'Claude' : 'Human'
      const ts = msg?.created_at ? ` [${msg.created_at}]` : ''
      const text = messageText(msg)
      // sender/timestamp goes on its own line so any "Session Log" heading inside the
      // message body still starts at the beginning of its own line
      if (text) parts.push(`\n${sender}:${ts}\n${text}\n`)
    }
  }

  if (Array.isArray(data)) {
    // Could be a full export (array of conversations) or a raw message array
    for (const item of data) {
      if (item?.chat_messages || item?.messages) {
        flattenConversation(item)
      } else if (item?.sender || item?.text) {
        flattenConversation({ chat_messages: [item] })
      }
    }
  } else if (data && typeof data === 'object') {
    flattenConversation(data)
  }

  return parts.join('')
}

function extractLabeled(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`\\*{0,2}${label}\\*{0,2}\\s*:\\s*(.+)`, 'i')
    const m = text.match(re)
    if (m) return m[1].trim().replace(/\*+$/, '').trim()
  }
  return null
}

function extractListAfterLabel(text: string, labels: string[]): string[] {
  for (const label of labels) {
    const re = new RegExp(`\\*{0,2}${label}\\*{0,2}\\s*:?\\s*\\n?`, 'i')
    const m = re.exec(text)
    if (!m) continue
    const rest = text.slice(m.index + m[0].length)
    const lines = rest.split('\n')
    const items: string[] = []
    // inline comma-separated value on the same construct, e.g. "Techniques used: breathing, defusion"
    const sameLine = m[0].match(/:\s*(\S.*)$/)
    if (sameLine && sameLine[1] && !sameLine[1].match(/^[-*•]/)) {
      return sameLine[1]
        .split(/,|;/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (items.length) break
        continue
      }
      const bulletMatch = trimmed.match(/^(?:[-*•]|\d+[.)])\s*(.+)/)
      if (bulletMatch) {
        items.push(bulletMatch[1].trim())
      } else if (items.length === 0 && /^[A-Za-z]/.test(trimmed)) {
        // no bullets used; treat as a single comma-separated line
        return trimmed
          .split(/,|;/)
          .map((s) => s.trim())
          .filter(Boolean)
      } else {
        break
      }
    }
    if (items.length) return items
  }
  return []
}

function extractRung(text: string): number | null {
  // prefer an explicit "Rung: 5" / "Rung #5:" label over a bare "rung 5" mention
  // elsewhere in the block (e.g. inside later free-form dialogue)
  const labeled = text.match(/rung\s*#?\s*:\s*(\d+)/i)
  if (labeled) return Number(labeled[1])
  const bare = text.match(/rung\s*#?\s*(\d+)/i)
  return bare ? Number(bare[1]) : null
}

function extractTargetRange(text: string): [number, number] | null {
  const m = text.match(/target(?:\s*suds)?(?:\s*range)?\s*:?\s*\(?(\d+)\s*(?:-|to|–|—)\s*(\d+)\)?/i)
  if (!m) return null
  return [Number(m[1]), Number(m[2])]
}

function extractVariation(text: string): string | null {
  const m = text.match(/variation\s*#?\s*:?\s*([A-Za-z0-9][A-Za-z0-9 ]{0,20})/i)
  return m ? m[1].trim() : null
}

function extractDuration(text: string): number | null {
  const m = text.match(/(?:planned\s*duration|duration)\s*:?\s*(\d+)\s*min/i) ?? text.match(/(\d+)[\s-]*minute\s*exposure/i)
  return m ? Number(m[1]) : null
}

function extractDate(text: string): string | null {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return iso[0]
  const monthName = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i,
  )
  if (monthName) {
    const d = new Date(`${monthName[1]} ${monthName[2]}, ${monthName[3]}`)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)
  if (slash) {
    const [, mo, day, yr] = slash
    return `${yr}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return null
}

function extractHierarchy(text: string): string | null {
  const labeled = extractLabeled(text, ['hierarchy'])
  if (labeled) return labeled.replace(/[.,]$/, '')

  // fallback for unlabeled dialogue: a capitalized phrase directly followed by
  // ", rung N" (e.g. "let's try Catastrophic Environmental Threat, rung 4")
  const nearRung = text.match(/([A-Z][A-Za-z/ ]{2,60}?),?\s+rung\s*#?\s*\d+/)
  if (nearRung) return nearRung[1].trim()

  return null
}

function extractSudsReadings(text: string): SudsReading[] {
  const readings: SudsReading[] = []

  const preMatch = text.match(/(?:pre-?exposure|baseline)\s*suds\s*:?\s*(\d+(?:\.\d+)?)/i)
  if (preMatch) readings.push({ label: 'pre', time_or_minute: 0, suds: Number(preMatch[1]) })

  const rereadMatch = text.match(/reread\s*suds\s*:?\s*(\d+(?:\.\d+)?)/i)
  if (rereadMatch) readings.push({ label: 'reread', time_or_minute: 'reread', suds: Number(rereadMatch[1]) })

  // "5 min: SUDs 7" / "5-min: 7" / "@5 min - 7" / "5min SUDs: 7"
  const minRe = /(\d+)\s*[- ]?min(?:ute)?s?\s*[:@\-–]?\s*(?:suds\s*:?\s*)?(\d+(?:\.\d+)?)/gi
  let m: RegExpExecArray | null
  while ((m = minRe.exec(text))) {
    readings.push({ label: `${m[1]}min`, time_or_minute: Number(m[1]), suds: Number(m[2]) })
  }

  // clock timestamps: "10:42am - SUDs 6" / "10:42 AM: 6"
  const timeRe = /(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[:\-–]\s*(?:suds\s*:?\s*)?(\d+(?:\.\d+)?)/gi
  while ((m = timeRe.exec(text))) {
    readings.push({ label: m[1].trim(), time_or_minute: m[1].trim(), suds: Number(m[2]) })
  }

  const endMatch = text.match(/(?:end|final|post-?exposure)\s*suds\s*:?\s*(\d+(?:\.\d+)?)/i)
  if (endMatch) readings.push({ label: 'end', time_or_minute: 'end', suds: Number(endMatch[1]) })

  // dedupe identical (label, suds) pairs that regexes may double-count
  const seen = new Set<string>()
  return readings.filter((r) => {
    const key = `${r.label}|${r.time_or_minute}|${r.suds}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function detectTechniques(text: string): string[] {
  const labeled = extractListAfterLabel(text, ['techniques used', 'coping techniques', 'techniques'])
  if (labeled.length) return labeled

  const found = new Set<string>()
  const lower = text.toLowerCase()
  for (const technique of KNOWN_TECHNIQUES) {
    if (lower.includes(technique)) found.add(technique)
  }
  return Array.from(found)
}

function extractCompulsions(text: string): {
  targeted: string[]
  completed: string[]
  resisted: boolean | null
  flags: string[]
} {
  const flags: string[] = []
  const targeted = extractListAfterLabel(text, [
    'compulsions targeted',
    'compulsions to resist',
    'compulsions',
  ])
  const completed = extractListAfterLabel(text, ['compulsions completed', 'compulsions performed'])
  const resistedList = extractListAfterLabel(text, ['compulsions resisted'])

  let resisted: boolean | null = null
  if (/fully resisted|100%\s*resisted|no compulsions completed/i.test(text)) {
    resisted = true
  } else if (/partially resisted|partial resistance/i.test(text)) {
    resisted = false
  } else if (completed.length > 0) {
    resisted = false
  } else if (targeted.length > 0 || resistedList.length > 0) {
    resisted = true
  } else {
    flags.push('compulsion resistance status not found — review manually')
  }

  return { targeted: targeted.length ? targeted : resistedList, completed, resisted, flags }
}

function extractNotes(text: string): string {
  const notes = extractLabeled(text, ['notes', 'flag for specialist', 'flags?'])
  return notes ?? ''
}

/** Locate candidate session boundaries: prefer labeled "Session Log" blocks, else rung/hierarchy mentions. */
function findSessionBlocks(text: string): string[] {
  const headingRe = /^.{0,10}(session log|session summary|closing summary|close-?out summary)\b.*$/gim
  const headingMatches = [...text.matchAll(headingRe)]

  if (headingMatches.length > 0) {
    const turnMarkerRe = /\n\s*(human|claude|user|assistant)\s*:/i
    const blocks: string[] = []
    for (let i = 0; i < headingMatches.length; i++) {
      const start = headingMatches[i].index!
      const nextHeadingStart = i + 1 < headingMatches.length ? headingMatches[i + 1].index! : text.length
      // stop at the next conversational turn so a following "Human:"/"Claude:" exchange
      // (e.g. the user starting their next session) isn't absorbed into this one's block
      const rest = text.slice(start, nextHeadingStart)
      const turnMatch = turnMarkerRe.exec(rest)
      const end = turnMatch ? start + turnMatch.index : nextHeadingStart
      blocks.push(text.slice(start, end))
    }
    return blocks
  }

  // fallback: split on rung mentions, but a session's own opening exchange
  // ("let's do rung 4" / "okay, rung 4:") typically repeats the same rung number
  // within a few hundred characters — treat consecutive mentions of the same
  // rung, close together, as one session rather than starting a new one each time
  const rungRe = /rung\s*#?\s*(\d+)/gi
  const rungMatches = [...text.matchAll(rungRe)]
  if (rungMatches.length === 0) return []

  // back up to the start of the enclosing line so lead-in context on the same line
  // (e.g. a hierarchy name right before "rung N") isn't cut off
  const lineStart = (index: number) => {
    const priorNewline = text.lastIndexOf('\n', index)
    return priorNewline === -1 ? 0 : priorNewline + 1
  }

  const SAME_SESSION_GAP = 600
  const blocks: string[] = []
  let blockStart = lineStart(rungMatches[0].index!)
  let blockRung = rungMatches[0][1]
  let lastMatchIndex = rungMatches[0].index!

  for (let i = 1; i < rungMatches.length; i++) {
    const m = rungMatches[i]
    const sameSession = m[1] === blockRung && m.index! - lastMatchIndex < SAME_SESSION_GAP
    if (!sameSession) {
      blocks.push(text.slice(blockStart, lineStart(m.index!)))
      blockStart = lineStart(m.index!)
      blockRung = m[1]
    }
    lastMatchIndex = m.index!
  }
  blocks.push(text.slice(blockStart, text.length))
  return blocks
}

function buildSession(block: string, index: number, usedFallback: boolean): Session {
  const flags: string[] = []
  if (usedFallback) flags.push('no labeled session-log block found — extracted from raw dialogue')

  const date = extractDate(block)
  if (!date) flags.push('date not found — please set manually')

  const hierarchy = extractHierarchy(block)
  if (!hierarchy) flags.push('hierarchy not found — please set manually')

  const rung = extractRung(block)
  if (rung === null) flags.push('rung number not found — please set manually')

  const rungDescription = extractLabeled(block, ['rung description', 'scenario']) ?? ''
  const targetRange = extractTargetRange(block)
  const variation = extractVariation(block)
  const plannedDuration = extractDuration(block)
  const readings = extractSudsReadings(block)
  if (readings.length === 0) flags.push('no SUDs readings found — please add manually')

  const explicitPeak = block.match(/peak\s*suds\s*:?\s*(\d+(?:\.\d+)?)/i)
  const peak = explicitPeak
    ? Number(explicitPeak[1])
    : readings.length
      ? Math.max(...readings.map((r) => r.suds))
      : null

  const endReading = readings.find((r) => r.label === 'end')
  const end = endReading ? endReading.suds : readings.length ? readings[readings.length - 1].suds : null

  const { targeted, completed, resisted, flags: compulsionFlags } = extractCompulsions(block)
  const techniques = detectTechniques(block)
  const notes = extractNotes(block)

  const dateForId = date ?? `undated-${index + 1}`
  const rungForId = rung ?? 'NA'

  return {
    id: newId(),
    session_id: `${dateForId}-rung${rungForId}`,
    date: date ?? '',
    hierarchy: hierarchy ?? '',
    rung,
    rung_description: rungDescription,
    target_suds_range: targetRange,
    variation,
    planned_duration_minutes: plannedDuration,
    readings,
    peak_suds: peak,
    end_suds: end,
    compulsions_targeted: targeted,
    compulsions_completed: completed,
    compulsions_resisted: resisted,
    techniques_used: techniques,
    notes,
    flags: [...flags, ...compulsionFlags],
    source_excerpt: block.trim().slice(0, 4000),
  }
}

export function parseImportText(raw: string): ParseResult {
  const warnings: string[] = []
  const trimmed = raw.trim()
  if (!trimmed) return { sessions: [], warnings: ['input was empty'] }

  let transcript = raw
  if (looksLikeJson(trimmed)) {
    try {
      const data = JSON.parse(trimmed)
      const flattened = flattenClaudeExport(data)
      if (flattened.trim()) {
        transcript = flattened
      } else {
        warnings.push('input looked like JSON but no recognizable conversation messages were found — parsing as raw text')
      }
    } catch {
      warnings.push('input looked like JSON but failed to parse — parsing as raw text')
    }
  }

  const headingRe = /^.{0,10}(session log|session summary|closing summary|close-?out summary)\b.*$/gim
  const usedFallback = ![...transcript.matchAll(headingRe)].length

  const blocks = findSessionBlocks(transcript)
  if (blocks.length === 0) {
    warnings.push('no session boundaries could be detected — no sessions extracted')
    return { sessions: [], warnings }
  }

  if (usedFallback) {
    warnings.push(
      `no labeled "Session Log" blocks found — fell back to extracting ${blocks.length} session(s) from raw dialogue; please review carefully`,
    )
  }

  const sessions = blocks.map((block, i) => buildSession(block, i, usedFallback))
  return { sessions, warnings }
}
